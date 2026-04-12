import "dotenv/config";
import { runBenchmark } from "./benchmark/runner.js";

runBenchmark().catch(console.error);
