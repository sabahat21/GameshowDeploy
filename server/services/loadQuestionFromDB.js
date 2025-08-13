import { Counter, GameQuestion } from "../models/gameQuestion.model.js";
import { ApiError } from "../utils/ApiError.js";
import { QUESTION_CATEGORY, QUESTION_LEVEL } from "../utils/constants.js";
import { SCHEMA_MODELS } from "../utils/enums.js";
import { getQuestions } from "./questionService.js";

export async function prepareGameQuestions() {
  const questions = await getQuestions(SCHEMA_MODELS.FINALQUESTION);

  if (!questions.length) {
    throw new ApiError(
      500,
      "No New questions found to load into game. All The questions were used in previous Game."
    );
  }

  // Get the Index for the toss up Question
  const tossUpIndex = questions.findIndex(
    (q) => q.questionLevel === QUESTION_LEVEL.INTERMEDIATE
  );

  if (tossUpIndex === -1) {
    throw new ApiError(
      400,
      "No INTERMEDIATE-level question found for toss-up."
    );
  }

  // Remove the toss Up question from the questions Array so i wont show in the game questions again
  const [tossUpQuestion] = questions.splice(tossUpIndex, 1);

  // // Add that question to the index 0 of questions Array
  // questions.unshift(tossUpQuestion);

  const updatedTossUpQuestion = {
    ...tossUpQuestion.toObject(),
    round: 0,
    questionNumber: 1,
  };
  // Step 2: Extract all valid questionIDs
  const questionIDs = questions
    .map((q) => q._id)
    .filter((id) => typeof id === "string" && id.trim() !== "");

  if (questionIDs.length === 0) {
    throw new ApiError(400, "No valid Question IDs provided.");
  }

  // Clean Counter Before giving new questionNumber
  await Counter.deleteMany();

  // 1. Get and increment counter in one DB call
  const counter = await Counter.findByIdAndUpdate(
    { _id: "gameQuestion" },
    { $inc: { seq: questions.length } },
    { new: true, upsert: true }
  );

  // 2. Calculate starting number
  const startNumber = counter.seq - questions.length + 1;

  // 3. Inject questionNumbers manually
  const groupSize = 3;
  const teams = ["team1", "team2"];

  const updatedQuestions = questions.map((q, idx) => {
    const groupIndex = Math.floor(idx / groupSize);
    const teamAssignment = teams[groupIndex % teams.length];
    const questionNumber = (idx % groupSize) + 1;
    let round;
    if (q.questionLevel === QUESTION_LEVEL.BEGINNER) {
      round = 1;
    } else if (q.questionLevel === QUESTION_LEVEL.INTERMEDIATE) {
      round = 2;
    } else {
      round = 3;
    }

    return {
      ...q.toObject(),
      questionNumber: questionNumber,
      teamAssignment: teamAssignment,
      round: round,
    };
  });

  // Clear old ones before inserting
  await GameQuestion.deleteMany();
  await GameQuestion.insertMany(updatedQuestions);

  // Uncomment to set used: true -- to not use the same questions again for a new game

  // await FinalQuestion.updateMany(
  // { _id: { $in: questionIDs } }
  // { $set: { used: true } }
  // );
  return {
    updatedTossUpQuestion,
    updatedQuestions,
  };
}
