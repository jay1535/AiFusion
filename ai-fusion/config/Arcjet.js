import arcjet, { tokenBucket } from "@arcjet/next";

export const aj = arcjet({
  key: process.env.ARCJET_KEY, // your Arcjet project key
  rules: [
    tokenBucket({
      mode: "LIVE",             // LIVE or DRY_RUN
      characteristics: ["userId"],  // rate limit based on IP (use "userId" if authenticated)
      refillRate: 10,            // add 5 tokens every 10 seconds
      interval: 86400,             // seconds
      capacity: 10,             // maximum 10 tokens in the bucket
    }),
  ],
});
