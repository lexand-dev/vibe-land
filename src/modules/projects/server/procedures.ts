import z from "zod";

import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { generateSlug } from "random-word-slugs";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const projectsRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, "Project ID is required")
      })
    )
    .query(async ({ input }) => {
      const message = await prisma.project.findUnique({
        where: {
          id: input.id
        }
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Project not found`
        });
      }

      return message;
    }),
  getMany: baseProcedure.query(async () => {
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: "desc"
      }
    });

    return projects;
  }),
  create: baseProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, "Value is required")
          .max(10000, "Value is too long")
      })
    )
    .mutation(async ({ input }) => {
      const createdProject = await prisma.project.create({
        data: {
          name: generateSlug(2, { format: "kebab" }),
          userId: "system", // TODO: Replace with actual user ID when authentication is implemented
          messages: {
            create: {
              role: "USER",
              type: "RESULT",
              content: input.value
            }
          }
        }
      });

      await inngest.send({
        name: "code-agent/run",
        data: {
          value: input.value,
          projectId: createdProject.id
        }
      });

      return createdProject;
    })
});
