import mongoose from "mongoose";
import { env } from "./env";

//Protege contra ataques de inyección de MongoDB al desinfectar los filtros de consulta
mongoose.set("sanitizeFilter", true);

export async function connectDB(): Promise<void> {
    if (!env.mongodbUri) {
        throw new Error("No se encontró la variable de entorno MONGODB_URI");
    }

    await mongoose.connect(env.mongodbUri);
    console.log("Conectado a la base de datos MongoDB");
}