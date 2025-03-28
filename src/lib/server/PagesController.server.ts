import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const createPage = async (title: string, slug: string) => {
    const result = await prisma.pages.create({
        data: {
            title: title,
            createdAt: new Date(),
            updatedAt: new Date(),
            slug: slug,
        }
    })

    return result
}

export const pageExists = async (slug: string): Promise<boolean> => {
    const page = await prisma.pages.findFirst({
        where: {
            slug: slug,
        }
    })
    return page !== null
}

export const getPages = async () => {
    const pages = await prisma.pages.findMany()
    return pages
}