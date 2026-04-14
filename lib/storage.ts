// Resume storage: Google Drive (via the signed-in user's OAuth token).
//
// - Files are uploaded to a folder in the user's Google Drive.
// - The folder is created once and its ID stored on the Candidate record via `resumeKey`.
// - Files are shared as "anyone with the link can view" so other team members
//   can view them from the candidate detail page.
//
// Drive scope required: https://www.googleapis.com/auth/drive.file
// (only manages files created by this app)

const DRIVE_API = "https://www.googleapis.com/";
const FOLDER_NAME = "Engram Hiring — Resumes";

export type StoredFile = { url: string; key: string };

/**
 * Ensure the shared resume folder exists in Drive and return its ID.
 * Caches in a module-level map keyed by access token (short-lived anyway).
 */
const folderCache = new Map<string, string>();

async function ensureFolder(accessToken: string): Promise<string> {
  const cached = folderCache.get(accessToken);
  if (cached) return cached;

  // Check if folder already exists.
  const searchRes = await fetch(
    `${DRIVE_API}drive/v3/files?q=${encodeURIComponent(
      `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    )}&fields=files(id)&spaces=drive`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (searchRes.ok) {
    const data = (await searchRes.json()) as { files: { id: string }[] };
    if (data.files.length > 0) {
      folderCache.set(accessToken, data.files[0].id);
      return data.files[0].id;
    }
  }

  // Create the folder.
  const createRes = await fetch(`${DRIVE_API}drive/v3/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Failed to create Drive folder: ${createRes.status} ${await createRes.text()}`);
  }
  const folder = (await createRes.json()) as { id: string };
  folderCache.set(accessToken, folder.id);
  return folder.id;
}

/**
 * Upload a file to Google Drive and return the web view link + file ID.
 */
export async function storeFile(
  file: File,
  accessToken: string,
): Promise<StoredFile> {
  const folderId = await ensureFolder(accessToken);

  // Multipart upload: metadata + file content.
  const metadata = JSON.stringify({
    name: file.name,
    parents: [folderId],
  });

  const boundary = "----DriveUploadBoundary" + Date.now();
  const bodyParts = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
  ];

  const fileBuffer = await file.arrayBuffer();
  const encoder = new TextEncoder();
  const part1 = encoder.encode(bodyParts[0]);
  const part2 = encoder.encode(bodyParts[1]);
  const ending = encoder.encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(part1.length + part2.length + fileBuffer.byteLength + ending.length);
  body.set(part1, 0);
  body.set(part2, part1.length);
  body.set(new Uint8Array(fileBuffer), part1.length + part2.length);
  body.set(ending, part1.length + part2.length + fileBuffer.byteLength);

  const uploadRes = await fetch(
    `${DRIVE_API}upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!uploadRes.ok) {
    throw new Error(`Drive upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  const result = (await uploadRes.json()) as { id: string; webViewLink: string };

  // Make the file viewable by anyone with the link so all teammates can access it.
  await fetch(`${DRIVE_API}drive/v3/files/${result.id}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return {
    url: result.webViewLink,
    key: result.id, // Drive file ID, used for deletion
  };
}

/**
 * Delete a file from Google Drive by file ID.
 */
export async function deleteFile(
  fileId: string | null | undefined,
  accessToken: string,
) {
  if (!fileId) return;
  try {
    await fetch(`${DRIVE_API}drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // best-effort
  }
}
