import dayjs from "dayjs";
import { db } from "../db";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { goalCompletions, goals } from "../db/schema";

export async function getWeekPendingGoals() {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  console.log(lastDayOfWeek.toISOString());


  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    db
    .select({
      id: goals.id,
      title: goals.title,
      desireWeeklyFrequency: goals.desiredWeeklyFrequency,
      createdAt: goals.createdAt,
    })
    .from(goals)
    .where(
      lte(goals.createdAt, lastDayOfWeek
      ))
  )

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
        lte(goalCompletions.createdAt, lastDayOfWeek)
    ))
    .groupBy(goalCompletions.goalId)
  )

  const pendingGoals = await db
  .with(goalsCreatedUpToWeek, goalsCompletionCounts)
  .select({
    id: goalsCreatedUpToWeek.id,
    title: goalsCreatedUpToWeek.title,
    desireWeeklyFrequency: goalsCreatedUpToWeek.desireWeeklyFrequency,
    completionCount: sql/*sql*/`
    COALESCE(${goalsCompletionCounts.completionCount}, 0)
    `.mapWith(Number)
  })
  .from(goalsCreatedUpToWeek)
  .leftJoin(
    goalsCompletionCounts,
    eq(goalsCompletionCounts.goalId, goalsCreatedUpToWeek.id)
  )

  return { pendingGoals }
}