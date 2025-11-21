import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetUserId = formData.get('targetUserId') as string;
    const senderUserId = formData.get('senderUserId') as string;

    if (!file || !targetUserId || !senderUserId) {
      return NextResponse.json(
        { success: false, error: 'Missing file, targetUserId, or senderUserId' },
        { status: 400 }
      );
    }

    // Create downloads directory in user's home
    const downloadsDir = path.join(os.homedir(), 'Downloads', 'FileTransfer', `from_user_${senderUserId}`);
    await fs.mkdir(downloadsDir, { recursive: true });

    // Save file
    const buffer = await file.arrayBuffer();
    const filePath = path.join(downloadsDir, file.name);
    await fs.writeFile(filePath, Buffer.from(buffer));

    console.log(`File received: ${file.name} from User ${senderUserId} to User ${targetUserId}`);

    return NextResponse.json({
      success: true,
      message: `File ${file.name} received successfully`,
      filePath,
      fileName: file.name,
      fileSize: file.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
