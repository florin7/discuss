"use server";

import type { Post, Topic } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import paths from "@/paths";

const createPostSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
});

interface CreatePostFormState {
  errors: {
    title?: string[];
    content?: string[];
    _form?: string[];
  };
}

export async function createPost(
  topicSlug: string,
  formState: CreatePostFormState,
  formData: FormData,
): Promise<CreatePostFormState> {
  const result = createPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return {
      errors: {
        _form: ["You must be signed in"],
      },
    };
  }

  const topic: Topic | null = await db.topic.findFirst({
    where: {
      slug: topicSlug,
    },
  });

  if (!topic) {
    return {
      errors: {
        _form: ["Topic not found"],
      },
    };
  }

  let post: Post;
  try {
    post = await db.post.create({
      data: {
        topicId: topic.id,
        content: result.data.content,
        title: result.data.title,
        userId: session.user.id,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        errors: {
          _form: [error.message],
        },
      };
    } else {
      return {
        errors: {
          _form: ["Failed to create a post"],
        },
      };
    }
  }

  revalidatePath(paths.topicShow(topicSlug));
  redirect(paths.postShow(topicSlug, post.id));
}
