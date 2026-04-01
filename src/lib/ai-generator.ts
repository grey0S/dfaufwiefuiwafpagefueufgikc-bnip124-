export type GenerateQuestParams = {
  context: string;
  participantsCount: number;
  isExplosive: boolean;
};

const LOCATIONS = ["park", "mall", "street", "house", "bar", "gym", "school", "office"];
const ACTIONS_STREET = ["Find a stranger and", "Walk backwards until you", "Take a dramatic photo while you"];
const ACTIONS_INDOOR = ["Crawl briefly to", "Whisper loudly about a", "Secretly place a small object near a"];
const ACTIONS_EXPLOSIVE = ["Start a harmless flash mob doing", "Convince someone you are a time traveler looking for", "Loudly narrate someone's mundane task like an esports caster involving"];

const OBJECTS = ["squirrel", "coffee cup", "bench", "statue", "security camera", "pigeon", "neon sign"];

export function generateLocalQuest({ context, participantsCount, isExplosive }: GenerateQuestParams) {
  // Simple NLP keyword extraction spoof
  const ctxLower = context.toLowerCase();
  
  let isIndoor = ctxLower.includes("house") || ctxLower.includes("mall") || ctxLower.includes("office") || ctxLower.includes("bar");
  
  const actions = isExplosive ? ACTIONS_EXPLOSIVE : (isIndoor ? ACTIONS_INDOOR : ACTIONS_STREET);
  const selectedAction = actions[Math.floor(Math.random() * actions.length)];
  const selectedObject = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
  
  const titleWords = ["The", isExplosive ? "Explosive" : "Silent", "Operation:", selectedObject.toUpperCase()];
  const title = titleWords.join(" ");

  let description = `${selectedAction} ${selectedObject}. You have 7 days.`;
  
  if (participantsCount > 1) {
    description += ` Group Bonus: Do this while physically linked or referencing each other loudly!`;
  }

  let difficulty = "Medium";
  if (isExplosive) difficulty = "Explosive";
  else if (participantsCount > 3) difficulty = "Hard";
  else if (isIndoor) difficulty = "Easy";

  return { title, description, difficulty };
}
