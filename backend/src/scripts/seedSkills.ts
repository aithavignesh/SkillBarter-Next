import { connectDatabase, disconnectDatabase } from "../config/database";
import { Skill } from "../models/Skill";

const starterSkills = [
  ["Python Programming", "Programming", "Learn Python fundamentals, problem solving, and practical scripting."],
  ["Java Programming", "Programming", "Practice Java syntax, object-oriented programming, and application development."],
  ["C Programming", "Programming", "Learn C fundamentals, memory, pointers, and low-level programming."],
  ["C++ Programming", "Programming", "Practice C++ programming, STL, and object-oriented design."],
  ["Data Structures and Algorithms", "Programming", "Build problem-solving skills with data structures, algorithms, and complexity analysis."],
  ["Git and GitHub", "Programming", "Learn version control, collaboration, branches, pull requests, and code reviews."],
  ["HTML and CSS", "Web Development", "Build accessible, responsive web pages with semantic HTML and modern CSS."],
  ["JavaScript", "Web Development", "Learn modern JavaScript, browser APIs, and asynchronous programming."],
  ["React", "Web Development", "Build component-based user interfaces with React."],
  ["Next.js", "Web Development", "Build full-stack web applications using Next.js and the App Router."],
  ["Node.js and Express", "Web Development", "Create REST APIs and backend services using Node.js and Express."],
  ["SQL and Database Design", "Databases", "Learn relational queries, schema design, joins, and indexing."],
  ["MongoDB", "Databases", "Model documents, query collections, and work with MongoDB indexes."],
  ["Machine Learning", "AI and Data Science", "Learn supervised and unsupervised learning, evaluation, and model selection."],
  ["Deep Learning", "AI and Data Science", "Explore neural networks, training workflows, and model evaluation."],
  ["Generative AI and LLMs", "AI and Data Science", "Learn large language models, prompting, retrieval, and responsible AI."],
  ["Data Analysis with Python", "AI and Data Science", "Analyze datasets using Python, pandas, visualization, and statistics."],
  ["Statistics and Probability", "Mathematics", "Build foundations in probability, distributions, estimation, and hypothesis testing."],
  ["Linear Algebra", "Mathematics", "Practice vectors, matrices, transformations, and applications in machine learning."],
  ["UI/UX Design", "Design", "Learn user research, wireframing, prototyping, and usability testing."],
  ["Figma", "Design", "Create interfaces, prototypes, and reusable design systems in Figma."],
  ["Graphic Design", "Design", "Learn visual hierarchy, typography, layout, and brand communication."],
  ["Spoken English", "Languages", "Improve conversational English, pronunciation, and confidence."],
  ["Telugu Language", "Languages", "Practice Telugu conversation, vocabulary, and everyday communication."],
  ["Hindi Language", "Languages", "Practice Hindi conversation, vocabulary, and grammar."],
  ["Public Speaking", "Communication", "Improve presentations, storytelling, and speaking confidence."],
  ["Resume and Interview Preparation", "Career Development", "Improve resumes, project explanations, and technical interview readiness."],
  ["Project Management", "Business", "Learn planning, prioritization, teamwork, and delivery practices."],
  ["Digital Marketing", "Business", "Learn content strategy, SEO, analytics, and digital campaign fundamentals."],
  ["Photography", "Creative Arts", "Learn composition, lighting, framing, and practical photography."],
  ["Video Editing", "Creative Arts", "Learn editing workflows, pacing, audio, and storytelling."],
  ["Guitar", "Music", "Learn guitar basics, chords, rhythm, and practice techniques."],
  ["Personal Finance", "Life Skills", "Learn budgeting, saving, basic investing concepts, and financial planning."],
  ["Yoga and Flexibility", "Fitness", "Learn beginner-friendly flexibility, breathing, and mobility practices."],
  ["Cooking Basics", "Life Skills", "Learn kitchen safety, ingredient preparation, and everyday cooking techniques."],
] as const;

async function main(): Promise<void> {
  await connectDatabase();

  let inserted = 0;
  for (const [name, category, description] of starterSkills) {
    const normalizedName = name.toLowerCase().trim();
    const result = await Skill.updateOne(
      { normalizedName },
      {
        $setOnInsert: {
          name,
          normalizedName,
          category,
          description,
          approved: true,
        },
      },
      { upsert: true },
    );
    inserted += result.upsertedCount;
  }

  console.log(`Starter skill catalog complete: ${starterSkills.length} defined, ${inserted} inserted, existing records preserved.`);
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed starter skills.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
