import { page } from "$app/state";
import { createPage, getPages, pageExists } from "$lib/server/PagesController.server";
import type { Actions, ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async () => {
    return {
        pages: await getPages(),
    };
};

export const actions = {
    createPage: async (event) => {
        const formData = await event.request.formData();
        const slug = formData.get("slug") as string;
        const pageAlreadyExists = await pageExists(slug);

        if (pageAlreadyExists) {
            return {
                status: 400,
                error: "Page with this slug already exists",
            };
        }

        try {
            const result = await createPage(
                formData.get("title") as string,
                formData.get("slug") as string
            );

            return {
                status: 200,
                success: true,
                page: result,
            };
        } catch (error) {
            console.error("Error creating page:", error);
            return {
                status: 400,
                error: "Bad request",
            };
        }
    }
} satisfies Actions;