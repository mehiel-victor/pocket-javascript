import { and, count, eq, gte, lte, sql } from "drizzle-orm"
import { db } from "../db"
import { goalCompletions, goals } from "../db/schema"
import dayjs from "dayjs"

interface CreateGoalRequest {
 goalId: string
}

export async function createGoalCompletion({ 
  goalId }
  : CreateGoalRequest) {
    const firstDayOfWeek = dayjs().startOf('week').toDate()
    const lastDayOfWeek = dayjs().endOf('week').toDate()

    const goalsCompletionCounts = db.$with('goals_completion_counts').as(
      db
      .select({
        goalId: goalCompletions.goalId,
        completionCount: count(goalCompletions.id)
        .mapWith(Number)
        .as('completionCount'),
      })
      .from(goalCompletions)
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWeek),
          eq(goalCompletions.goalId, goalId)
      ))
      .groupBy(goalCompletions.goalId)
    )

  
  const result = await db
  .with(goalsCompletionCounts)
  .select({
    desireWeeklyFrequency: goals.desiredWeeklyFrequency,
    completionCount: sql/*sql*/`
    COALESCE(${goalsCompletionCounts.completionCount}, 0)
    `.mapWith(Number)
  })
  .from(goals)
  .leftJoin(goalsCompletionCounts, eq(goalsCompletionCounts.goalId, goals.id))
  .where(eq(goals.id, goalId))
  .limit(1)

  const { completionCount, desireWeeklyFrequency } = result[0]

  if (completionCount >= desireWeeklyFrequency) {
    throw new Error('Goal already completed this week!')
  }

  const insertResult = await db.insert(goalCompletions).values({ goalId }).returning()
  const goalCompletion = insertResult [0]

  return {
    goalCompletion
  }
}