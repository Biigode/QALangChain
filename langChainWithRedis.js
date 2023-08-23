import { config } from "dotenv";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RedisVectorStore } from "langchain/vectorstores/redis";
import { createClient } from "redis";

config();

const client = createClient({
  url: "redis://localhost:6379",
});
await client.connect();


const loader = new PDFLoader("./bcff11.pdf");
const docs = await loader.load();

const embeddings = new OpenAIEmbeddings({
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_ADA,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

const model = new ChatOpenAI({
  temperature: 0,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_GPT,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

// const vectorStore = await RedisVectorStore.fromDocuments(docs, embeddings, {
//   redisClient: client,
//   indexName: "docs",
// });

const vectorStore = new RedisVectorStore(embeddings, {
  redisClient: client,
  indexName: "docs",
});


const chunks = await vectorStore.similaritySearch(
  "Qual o historico de distribuicao de dividendos do BCFF11?",
  4
);

console.log(chunks);

const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(5), {
  returnSourceDocuments: true,
});
const chainRes = await chain.call({ query: "O que é fundo de investimento imobiliário BTG Pactual?" });
console.log(chainRes.text);

console.log("#######")

const chainRes1 = await chain.call({
  query: "Qual é o desconto patrimonial do BCFF11?",
});
console.log(chainRes1.text);

console.log("#######")

const chainRes2 = await chain.call({
  query: "Qual o historico de distribuicao de dividendos do BCFF11?",
});
console.log(chainRes2.text);

await client.disconnect();
