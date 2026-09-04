import moongose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
    if (!env.mongodbUri) {
        throw new Error("No se encontró la variable de entorno MONGODB_URI");
    }

    await moongose.connect(env.mongodbUri);
    console.log("Conectado a la base de datos MongoDB");
}