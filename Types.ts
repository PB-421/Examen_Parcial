import type {ObjectId} from "mongodb"


export type ModelLibro = {
    _id?: ObjectId
    Titulo: string
    Autores: ObjectId[]
    Copias_Disponibles: number
}

export type ModelAutor = {
    _id?: ObjectId
    Nombre: string
    Biografia: string
}

export type Libro = {
    id?: string
    Titulo: string
    Autores: ObjectId[]
    Copias_Disponibles: number
}

export type Autor = {
    id?: string
    Nombre: string
    Biografia: string
}