import "./tracing";
import express, { Request, Response } from "express";
import { trace, context } from "@opentelemetry/api";
import { BUCKET_NAME } from "./config";

// aws s3 ls s3://random-pictures | awk '{print "\"" $NF "\","}'
const IMAGES = [
  //   "Angrybird.JPG",
  "Arco&Tub.png",
  "a real heatmap.png",
  "angry-lemon-ufo.JPG",
  //  "austintiara4.png",
  "baby-roswell-tall.png",
  //   "baby-geese.jpg",
  "bbq.jpg",
  "beach.JPG",
  "bunny-mask.jpg",
  "busted-light.jpg",
  "cat-glowing-eyes.JPG",
  //   "cat-on-leash.JPG",
  "cat-with-bowtie.heic",
  //   "cat.jpg",
  "clementine.png",
  "cow-peeking.jpg",
  //  "different-animals-01.png",
  "dratini.png",
  //  "everything-is-an-experiment.png",
  "experiment.png",
  "fine-food.jpg",
  //    "flower.jpg",
  "frenwho.png",
  //   "genshin-spa.jpg",
  "honeycomb-dogfood-logo.png",
  "horse-maybe.png",
  "is-this-emeri.png",
  "jean-and-statue.png",
  "jessitron.png",
  "keys-drying.jpg",
  "lime-on-soap-dispenser.jpg",
  "loki-closeup.jpg",
  "paul-r-allen.png",
  "please.png",
  "roswell-nose.jpg",
  "roswell.JPG",
  "salt-packets-in-jar.jpg",
  "scarred-character.png",
  "square-leaf-with-nuts.jpg",
  "stu.jpeg",
  "sweating-it.png",
  "tennessee-sunset.JPG",
  "this-is-fine-trash.jpg",
  "trash-flat.jpg",
  "walrus-painting.jpg",
  "windigo.png",
  "yellow-lines.JPG",
  "big-foot.png", // SPRINGFIELD
  "cat-astronaut-statue.jpg", // SPRINGFIELD
  "giant-fork.jpg", // SPRINGFIELD
  "mini-golf-dinosaur.jpg", // SPRINGFIELD
  "phone-booth-sculpture.jpg", // SPRINGFIELD
  "pineapple-whip-storm.png", // SPRINGFIELD
].map((filename) => `https://${BUCKET_NAME}.s3.amazonaws.com/${filename}`);

const app = express();
const PORT = process.env.PORT || 10114;

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});

app.get("/imageUrl", async (req: Request, res: Response) => {
  const imageUrl = choose(IMAGES);
  trace.getActiveSpan()?.setAttributes({
    "app.imageUrl": imageUrl,
    "app.bucketName": BUCKET_NAME,
  });
  res.send({ imageUrl });
});

function choose<T>(array: T[]): T {
  const i = Math.floor(Math.random() * array.length);
  trace.getActiveSpan()?.setAttributes({
    "app.choiceIndex": i,
    "app.numberOfChoices": array.length,
  });
  return array[i];
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
