<script lang="ts">
    import { applyAction, enhance } from "$app/forms";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();
</script>

<h1>This is the cms editor</h1>

<p>Here you can edit the content of your website.</p>

<p>/ (homepage is mandatory) route</p>

<!-- Pages section with styling -->
<section class="pages-section">
    <h1>Pages:</h1>

    {#if data.pages && data.pages.length > 0}
        <div class="pages-grid">
            {#each data.pages as page}
                <div class="page-card">
                    <h3>{page.title}</h3>
                    <p class="slug">/{page.slug}</p>
                    <div class="actions">
                        <a href="/edit/{page.slug}" class="edit-button">Edit</a>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="no-pages">
            <p>No pages created yet. Create your first page below.</p>
        </div>
    {/if}

    <!-- form for creating a page -->
    <div class="create-page-section">
        <h2>Create a new page</h2>
        <form
            method="POST"
            action="?/createPage"
            class="create-page-form"
            use:enhance={({
                formElement,
                formData,
                action,
                cancel,
                submitter,
            }) => {
                return async ({ result, update }) => {
                    // `result` is an `ActionResult` object
                    console.log("Form submitted, result:", result);
                    console.log("Form submitted, update:", update);
                    // Apply the action to handle any redirects or other default behaviors
                    await applyAction(result);
                    // `update` is a function which triggers the default logic
                    // that would be triggered if this callback wasn't set
                    await update();
                };
            }}
        >
            <input type="text" name="title" placeholder="Title" required />
            <input type="text" name="slug" placeholder="Slug" required />
            <button type="submit">Create Page</button>
        </form>
    </div>
</section>

<style>
    .pages-section {
        margin: 2rem 0;
    }

    .pages-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .page-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1rem;
        background-color: #f9f9f9;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition:
            transform 0.2s,
            box-shadow 0.2s;
    }

    .page-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .page-card h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }

    .slug {
        color: #666;
        font-size: 0.9rem;
        margin: 0 0 1rem 0;
        font-family: monospace;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
    }

    .edit-button {
        background-color: #4d7bf3;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        text-decoration: none;
        font-size: 0.9rem;
    }

    .edit-button:hover {
        background-color: #3a66d9;
    }

    .no-pages {
        padding: 2rem;
        background-color: #f5f5f5;
        border-radius: 8px;
        text-align: center;
        color: #666;
        border: 1px dashed #ccc;
    }

    .create-page-section {
        margin-top: 2rem;
        padding: 1.5rem;
        background-color: #f0f4ff;
        border-radius: 8px;
    }

    .create-page-form {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
        margin-top: 1rem;
    }

    input {
        padding: 0.8rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        flex: 1;
        min-width: 200px;
    }

    button {
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.8rem 1.5rem;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.2s;
    }

    button:hover {
        background-color: #45a049;
    }
</style>
