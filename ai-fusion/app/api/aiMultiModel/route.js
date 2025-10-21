import { NextResponse } from "next/server";
import axios from "axios";
import fs from "fs";
import { writeFile } from "fs/promises";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const model = formData.get("model");
    const parentModel = formData.get("parentModel");
    const msg = formData.get("msg") ? JSON.parse(formData.get("msg")) : null;
    const file = formData.get("file");
    const audio = formData.get("audio");

    let filePath = null;
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      filePath = `/tmp/${file.name}`;
      await writeFile(filePath, buffer);
    }

    if (audio) {
      const bytes = await audio.arrayBuffer();
      const buffer = Buffer.from(bytes);
      filePath = `/tmp/recording.wav`;
      await writeFile(filePath, buffer);
    }

    const payload = {
      message: msg || [{ role: "user", content: "File or audio uploaded" }],
      aiModel: model,
      outputType: "text",
    };

    const response = await axios.post(
      "https://kravixstudio.com/api/v1/chat",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.KRAVIX_STUDIO_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json({ success: true, data: response.data });
  } catch (err) {
    console.error("Server Error:", err.message);
    return NextResponse.json(
      { error: "Error processing request", details: err.message },
      { status: 500 }
    );
  }
}
