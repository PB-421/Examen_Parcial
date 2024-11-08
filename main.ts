import { MongoClient, ObjectId } from "mongodb";
import { ModelAutor, ModelLibro } from "./Types.ts";
import { fromModeltoLibro } from "./utils.ts";

const url = Deno.env.get("MONGO_URL")

if(!url){
  console.error("Se necesita un .env con el enlace al cluster de Mongodb")
  Deno.exit(-1)
}

const client = new MongoClient(url);

  await client.connect();
  console.log('Conexion exitosa');
  const db = client.db("Biblioteca_Examen");
  const collectionLibros = db.collection<ModelLibro>('Libros');
  const collectionAutores = db.collection<ModelAutor>('Autores');

async function handler(req:Request):Promise<Response> {
    const metodo = req.method
    const url = new URL(req.url)
    const path = url.pathname

    if(metodo === "GET"){
      if(path === "/libros"){
        const searchparams = url.searchParams.get("titulo")
        if(searchparams){
        const librosOG = await collectionLibros.find({Titulo: searchparams}).toArray()

        if(librosOG.length===0){
          return new Response("error: No se encontraron libros con ese título.",{status:404})
        }

        const librosN = await Promise.all(librosOG.map((elem:ModelLibro) => fromModeltoLibro(elem,collectionAutores)))

        return new Response(JSON.stringify(librosN))
        }
        const searchparams2 = url.searchParams.get("id")
        if(searchparams2){
          const idConvertido = new ObjectId(searchparams2)
          const librosOG = await collectionLibros.find({_id: idConvertido}).toArray()
  
          if(librosOG.length===0){
            return new Response("error: No se encontraron libros con ese id.",{status:404})
          }
  
          const librosN = await Promise.all(librosOG.map((elem:ModelLibro) => fromModeltoLibro(elem,collectionAutores)))
  
          return new Response(JSON.stringify(librosN))
          }
        const librosOG = await collectionLibros.find().toArray()

        const librosN = await Promise.all(librosOG.map((elem:ModelLibro) => fromModeltoLibro(elem,collectionAutores)))

        return new Response(JSON.stringify(librosN))
      }
      return new Response("Path not found",{status:404})
    }else if(metodo === "POST"){
      if(path === "/libro"){
          if(!req.body) return new Response("Bad request",{status:400})
          const payload = await req.json()
          if(!payload.titulo || !payload.autores || !payload.copiasDisponibles)return new Response("El titulo y los autores son campos requeridos",{status:400})

          const CrearObjectIdAutores = payload.autores.map((elem:string) => new ObjectId(elem))
          
          const autores:ModelAutor[] = await collectionAutores.find({_id: {$in:CrearObjectIdAutores}}).toArray()

          if(autores.length !== payload.autores.length){
            return new Response("El autor no existe",{status:400})
          }

          const {insertedId} = await collectionLibros.insertOne({
            Titulo: payload.titulo,
            Autores: payload.autores.map((elem:string) => new ObjectId(elem)),
            Copias_Disponibles: payload.copiasDisponibles
          })

          return new Response(JSON.stringify({
            Message: "Libro insertado correctamente",
            id: insertedId,
            Titulo: payload.titulo,
            Autores: payload.autores.map((elem:string) => new ObjectId(elem)),
            Copias_Disponibles: payload.copiasDisponibles
          }),{status:201})
      }
      if(path === "/autor"){
        if(!req.body) return new Response("Bad request",{status:400})
          const payload = await req.json()
          if(!payload.nombre || !payload.biografia)return new Response("El nombre y la biografia son campos requeridos",{status:400})

          const {insertedId} = await collectionAutores.insertOne({
            Nombre: payload.nombre,
            Biografia: payload.biografia
          })

          return new Response(JSON.stringify({Message: "Autor insertado correctamente",
            id: insertedId,
            Titulo: payload.titulo,
            Biografia: payload.biografia
          }),{status:200})
      }
      return new Response("Path not found",{status:404})
    } else if(metodo === "PUT"){
      if(path === "/libro"){
        if(!req.body) return new Response("Bad request",{status:400})
        const payload = await req.json()
        if(!payload.titulo || !payload.autores || !payload.copiasDisponibles|| !payload.id)return new Response("Faltan campos",{status:400})

          const idConvertido = new ObjectId(payload.id)
        
        const CrearObjectIdAutores = payload.autores.map((elem:string) => new ObjectId(elem))
          
        const autores:ModelAutor[] = await collectionAutores.find({_id: {$in:CrearObjectIdAutores}}).toArray()

        if(autores.length !== payload.autores.length){
          return new Response("El autor no existe",{status:400})
        }

        const {modifiedCount} = await collectionLibros.updateOne(
          {_id: idConvertido},
          {$set:{Titulo: payload.titulo,Autores: CrearObjectIdAutores,Copias_Disponibles: payload.copiasDisponibles}})

        if(modifiedCount === 0){
          return new Response("error: Libro no encontrado",{status:404})
        }

          return new Response(JSON.stringify({Message: "Libro actualizado correctamente",
            id: payload.id,
            Titulo: payload.titulo,
            Autores: payload.autores.map((elem:string) => new ObjectId(elem)),
            Copias_Disponibles: payload.copiasDisponibles}))
        }
    } else if(metodo === "DELETE"){
      if(path === "/libro"){
        if(!req.body) return new Response("Bad request",{status:400})
        const payload = await req.json()
        if(!payload.id)return new Response("Faltan el id",{status:400})

        const idConvertido = new ObjectId(payload.id)

        const {deletedCount} = await collectionLibros.deleteOne({_id: idConvertido})

        if(deletedCount === 0){
          return new Response("error: Libro no encontrado",{status:404})
        }

        return new Response("Message: Libro eliminado correctamente",{status:200})
      }
    }

    return new Response("Method not found",{status:404})
}

Deno.serve({port:3000},handler)