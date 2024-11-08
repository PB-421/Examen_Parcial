import type {Collection, ObjectId} from "mongodb"
import { Autor, Libro, ModelAutor, ModelLibro } from "./Types.ts";

export function fromModelToAutor(autorM:ModelAutor):Autor  {
    return {
        id: autorM._id!.toString(),
        Nombre: autorM.Nombre,
        Biografia: autorM.Biografia
    }
}

export async function fromModeltoLibro(libroM:ModelLibro,ListaAutores:Collection<ModelAutor>):Promise<Libro> {
    
    const idAutores:ObjectId[] = libroM.Autores //ID de autores

    const Autores:ModelAutor[] = await ListaAutores.find({_id:{$in:idAutores}}).toArray()

    return {
        id: libroM._id!.toString(),
        Titulo: libroM.Titulo,
        Autores: Autores.map((elem:ModelAutor) => fromModelToAutor(elem)),
        Copias_Disponibles: libroM.Copias_Disponibles
    }
}

