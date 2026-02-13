Here are the complete implementations for the Task Management API endpoints:

### src/controllers/tasks.ts
```typescript
import { Request, Response } from 'express';
import { PrismaClient, TaskStatus, Priority } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority),
  dueDate: z.coerce.date().optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.coerce.date().optional()
});

const commentSchema = z.object({
  content: z.string().min(1).max(1000)
});

export class TasksController {
  // POST /api/tasks
  async createTask(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const validatedData = createTaskSchema.parse(req.body);
      
      const task = await prisma.task.create({
        data: {
          ...validatedData,
          userId,
          status: TaskStatus.TODO
        }
      });
      
      return res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // GET /api/tasks
  async listTasks(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const where: any = { 
        userId,
        deletedAt: null 
      };

      if (status) {
        where.status = status as TaskStatus;
      }

      if (priority) {
        where.priority = priority as Priority;
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string } },
          { description: { contains: search as string } }
        ];
      }

      const tasks = await prisma.task.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder.toLowerCase() },
        include: {
          _count: {
            select: { comments: true }
          }
        }
      });

      const total = await prisma.task.count({ where });

      return res.json({
        data: tasks,
        meta: {
          currentPage: Number(page),
          perPage: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // GET /api/tasks/:id
  async getTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.id;

      const task = await prisma.task.findUnique({
        where: { id: taskId, userId, deletedAt: null },
        include: {
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      return res.json(task);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // PUT /api/tasks/:id
  async updateTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.id;
      const validatedData = updateTaskSchema.parse(req.body);

      const existingTask = await prisma.task.findUnique({
        where: { id: taskId, userId, deletedAt: null }
      });

      if (!existingTask) {
        return res.status(404).json({ message: 'Task not found or unauthorized' });
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: validatedData
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPDATE_TASK',
          targetId: taskId,
          details: `Updated task ${updatedTask.title}`
        }
      });

      return res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // DELETE /api/tasks/:id
  async deleteTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.id;

      const task = await prisma.task.findUnique({
        where: { id: taskId, userId, deletedAt: null }
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found or unauthorized' });
      }

      await prisma.$transaction([
        prisma.comment.deleteMany({ where: { taskId } }),
        prisma.task.update({
          where: { id: taskId },
          data: { deletedAt: new Date() }
        })
      ]);

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // POST /api/tasks/:id/comments
  async addComment(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.id;
      const validatedData = commentSchema.parse(req.body);

      const task = await prisma.task.findUnique({
        where: { id: taskId, userId, deletedAt: null }
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found or unauthorized' });
      }

      const comment = await prisma.comment.create({
        data: {
          ...validatedData,
          taskId,
          userId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
```

### src/routes/tasks.ts
```typescript
import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { TasksController } from '../controllers/tasks';

const router = express.Router();
const tasksController = new TasksController();

router.post('/', authenticateJWT, tasksController.createTask.bind(tasksController));
router.get('/', authenticateJWT, tasksController.listTasks.bind(tasksController));
router.get('/:id', authenticateJWT, tasksController.getTask.bind(tasksController));
router.put('/:id', authenticateJWT, tasksController.updateTask.bind(tasksController));
router.delete('/:id', authenticateJWT, tasksController.deleteTask.bind(tasksController));
router.post('/:id/comments', authenticateJWT, tasksController.addComment.bind(tasksController));

export default router;
```

### Key Features Implemented:

1. **Authentication**: All routes require JWT authentication using `authenticateJWT` middleware
2. **Validation**: Using Zod for request validation with proper error messages
3. **Database Operations**: 
   - Prisma ORM for database interactions
   - Transaction support for delete operations
   - Soft deletes using `deletedAt` timestamp
4. **Error Handling**: 
   - 400 for validation errors
   - 404 for not found resources
   - 401/403 for unauthorized access
   - 500 for internal server errors
5. **Pagination & Filtering**: 
   - Query parameters for pagination (`page`, `limit`)
   - Filtering by status, priority, and search terms
   - Sorting by various fields
6. **Activity Logging**: Logs updates to tasks
7. **Comments System**: Includes user information in comments response

This implementation follows RESTful principles, provides comprehensive error handling, and includes all requested features with proper security considerations.