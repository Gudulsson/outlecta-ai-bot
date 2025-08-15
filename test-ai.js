import { generateAllContent } from "./src/aiProductAgent.js";

async function test() {
  console.log("Testing AI agent...");
  
  try {
    const content = await generateAllContent("Kyowa KFG-5-120-D17", "", "Kyowa");
    console.log("Content:", content);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
