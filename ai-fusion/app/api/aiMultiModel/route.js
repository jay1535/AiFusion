import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { model, msg, parentModel } = await req.json();

    const response = await axios.post(
      "https://kravixstudio.com/api/v1/chat",
      {
        message: msg,
        aiModel: model ,
        outputType: "text"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + process.env.KRAVIX_STUDIO_API_KEY
        }
      }
    );

    console.log(response.data);

    return NextResponse.json({
      ...response.data,
      model: parentModel
    });

  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to fetch response from Kravix Studio API" },
      { status: 500 }
    );
  }
}
