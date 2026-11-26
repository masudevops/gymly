-- Exercise guides: original step-by-step instructions and a key form tip for every built-in exercise.
-- Adds exercises.form_tip; instructions hold the steps, one per line. Updates only built-in rows by name.

alter table public.exercises add column form_tip text check (char_length(form_tip) <= 300);

do $$
declare
  spec jsonb := $json$[
 {
  "name": "Barbell Bench Press",
  "steps": [
   "Lie on the bench with eyes under the bar, feet flat, shoulder blades squeezed together.",
   "Unrack with straight arms and lower the bar to your mid-chest with elbows about 45° from your body.",
   "Press up and slightly back until your arms are straight over your shoulders."
  ],
  "tip": "Keep your upper back tight and feet planted; don't bounce the bar off your chest."
 },
 {
  "name": "Incline Barbell Bench Press",
  "steps": [
   "Set the bench to about 30° and lie with the bar over your eyes.",
   "Lower the bar to your upper chest, just below the collarbones.",
   "Press up until your arms are straight, keeping your wrists stacked over your elbows."
  ],
  "tip": "A low incline keeps the work on your upper chest rather than your shoulders."
 },
 {
  "name": "Decline Barbell Bench Press",
  "steps": [
   "Secure your legs on a decline bench and grip slightly wider than shoulder width.",
   "Lower the bar under control to your lower chest.",
   "Press up until your arms are straight."
  ],
  "tip": "Use a spotter or safeties: unracking on a decline is awkward."
 },
 {
  "name": "Dumbbell Bench Press",
  "steps": [
   "Sit with dumbbells on your thighs, lie back and bring them to chest level.",
   "Press up until the dumbbells nearly touch over your chest.",
   "Lower slowly until your upper arms are just below the bench line."
  ],
  "tip": "Dumbbells allow a deeper stretch: control the bottom instead of dropping into it."
 },
 {
  "name": "Incline Dumbbell Press",
  "steps": [
   "Set the bench to 30–45° and start with dumbbells at your upper chest.",
   "Press up and slightly in until your arms are straight.",
   "Lower under control to a comfortable stretch."
  ],
  "tip": "Keep your shoulder blades pinned to the bench throughout."
 },
 {
  "name": "Dumbbell Fly",
  "steps": [
   "Lie flat holding dumbbells above your chest with palms facing each other.",
   "With a slight bend in the elbows, open your arms in a wide arc until you feel a chest stretch.",
   "Squeeze the dumbbells back together along the same arc."
  ],
  "tip": "Keep the elbow bend fixed: this is a hug, not a press."
 },
 {
  "name": "Incline Dumbbell Fly",
  "steps": [
   "Set the bench to about 30° and hold dumbbells over your upper chest.",
   "Open your arms in a wide arc with soft elbows until you feel a stretch.",
   "Bring the dumbbells back together over your chest."
  ],
  "tip": "Use lighter weights than you press; the stretch is the point."
 },
 {
  "name": "Cable Crossover",
  "steps": [
   "Set pulleys high, take a handle in each hand and step forward into a split stance.",
   "With slightly bent elbows, sweep your hands down and together in front of your hips.",
   "Return slowly until you feel a stretch across your chest."
  ],
  "tip": "Lean slightly forward and keep your torso still; let the arms do the work."
 },
 {
  "name": "Low-to-High Cable Fly",
  "steps": [
   "Set pulleys low and hold a handle in each hand with arms at your sides.",
   "Sweep your hands up and together to chest height with soft elbows.",
   "Lower slowly back to the start."
  ],
  "tip": "Think about bringing your biceps toward each other to target the upper chest."
 },
 {
  "name": "Machine Chest Press",
  "steps": [
   "Adjust the seat so the handles line up with your mid-chest.",
   "Press the handles forward until your arms are almost straight.",
   "Return slowly until you feel a stretch in your chest."
  ],
  "tip": "Keep your back against the pad and shoulders down away from your ears."
 },
 {
  "name": "Pec Deck",
  "steps": [
   "Sit with your back against the pad and arms on the pads or handles at chest height.",
   "Bring your arms together in front of your chest.",
   "Return slowly until you feel a stretch, without letting the weight stack touch."
  ],
  "tip": "Pause and squeeze when your hands meet."
 },
 {
  "name": "Smith Machine Bench Press",
  "steps": [
   "Set the bench so the bar lowers to your mid-chest.",
   "Unlock the bar and lower it under control to your chest.",
   "Press up until your arms are straight, then re-lock the bar at the end."
  ],
  "tip": "Set the safety stops just below chest height before you start."
 },
 {
  "name": "Push-Up",
  "steps": [
   "Start in a plank with hands slightly wider than your shoulders.",
   "Lower your chest toward the floor with elbows angled back about 45°.",
   "Push the floor away until your arms are straight."
  ],
  "tip": "Keep your body in one straight line: don't let your hips sag."
 },
 {
  "name": "Incline Push-Up",
  "steps": [
   "Place your hands on a bench or box and walk your feet back into a plank.",
   "Lower your chest to the edge of the bench.",
   "Push back up until your arms are straight."
  ],
  "tip": "The higher the surface, the easier it is: lower it as you get stronger."
 },
 {
  "name": "Decline Push-Up",
  "steps": [
   "Put your feet on a bench and hands on the floor slightly wider than your shoulders.",
   "Lower your chest toward the floor.",
   "Push back up to straight arms."
  ],
  "tip": "Brace your core hard to stop your lower back from arching."
 },
 {
  "name": "Chest Dip",
  "steps": [
   "Support yourself on parallel bars with straight arms.",
   "Lean your torso forward and lower until your shoulders are slightly below your elbows.",
   "Press back up to straight arms."
  ],
  "tip": "Only go as deep as your shoulders feel comfortable."
 },
 {
  "name": "Deadlift",
  "steps": [
   "Stand with the bar over your mid-foot, hips-width stance, and grip just outside your legs.",
   "Brace, pull the slack out of the bar, and drive through the floor keeping the bar close to your legs.",
   "Stand tall with hips and knees locked, then lower the bar the same way."
  ],
  "tip": "Keep your back neutral and the bar touching your legs the whole way."
 },
 {
  "name": "Barbell Row",
  "steps": [
   "Hinge forward to about 45° with a slight knee bend, holding the bar at arm's length.",
   "Pull the bar to your lower ribs, driving your elbows back.",
   "Lower it under control to straight arms."
  ],
  "tip": "Keep your torso angle fixed: don't stand up to finish the rep."
 },
 {
  "name": "Pendlay Row",
  "steps": [
   "Hinge until your torso is nearly parallel to the floor with the bar on the ground.",
   "Row the bar explosively to your lower chest.",
   "Lower it back to the floor and reset each rep."
  ],
  "tip": "Every rep starts dead on the floor; don't use your legs to swing it."
 },
 {
  "name": "One-Arm Dumbbell Row",
  "steps": [
   "Place one hand and knee on a bench with the dumbbell hanging from the other hand.",
   "Pull the dumbbell toward your hip, keeping your elbow close.",
   "Lower it until your arm is straight and you feel a stretch."
  ],
  "tip": "Think of pulling your elbow to your back pocket, not lifting your hand."
 },
 {
  "name": "Chest-Supported Dumbbell Row",
  "steps": [
   "Lie face down on an incline bench with a dumbbell in each hand.",
   "Row both dumbbells toward your hips, squeezing your shoulder blades.",
   "Lower slowly to straight arms."
  ],
  "tip": "The bench removes cheating: keep your chest on the pad."
 },
 {
  "name": "T-Bar Row",
  "steps": [
   "Straddle the bar, hinge forward and grip the handle.",
   "Pull the handle toward your chest, keeping your back flat.",
   "Lower under control until your arms are straight."
  ],
  "tip": "Keep your chest up and avoid jerking with your hips."
 },
 {
  "name": "Machine Row",
  "steps": [
   "Adjust the seat so the handles line up with your lower chest.",
   "Pull the handles back, squeezing your shoulder blades together.",
   "Return slowly until your arms are straight."
  ],
  "tip": "Keep your chest against the pad if the machine has one."
 },
 {
  "name": "Seated Cable Row",
  "steps": [
   "Sit with knees slightly bent, holding the handle with arms straight.",
   "Pull the handle to your stomach while keeping your torso upright.",
   "Let your arms extend slowly and your shoulders reach forward."
  ],
  "tip": "Avoid rocking back and forth: move only your arms and shoulder blades."
 },
 {
  "name": "Lat Pulldown",
  "steps": [
   "Grip the bar slightly wider than your shoulders and sit with thighs under the pad.",
   "Pull the bar to your upper chest, driving your elbows down.",
   "Return slowly to straight arms."
  ],
  "tip": "Lean back slightly, but don't swing; pull with your back, not momentum."
 },
 {
  "name": "Close-Grip Lat Pulldown",
  "steps": [
   "Attach a close-grip handle and sit with thighs under the pad.",
   "Pull the handle to your upper chest, keeping elbows close.",
   "Return slowly to a full stretch overhead."
  ],
  "tip": "Let your shoulders rise at the top for a full range of motion."
 },
 {
  "name": "Straight-Arm Pulldown",
  "steps": [
   "Face a high pulley holding a bar or rope with straight arms.",
   "Sweep the bar down to your thighs, keeping your arms almost straight.",
   "Return slowly to shoulder height."
  ],
  "tip": "Hinge slightly forward and keep the elbows soft but fixed."
 },
 {
  "name": "Pull-Up",
  "steps": [
   "Hang from the bar with an overhand grip slightly wider than your shoulders.",
   "Pull your chest toward the bar until your chin clears it.",
   "Lower yourself all the way to straight arms."
  ],
  "tip": "Start each rep by pulling your shoulders down, not by bending your arms."
 },
 {
  "name": "Chin-Up",
  "steps": [
   "Hang from the bar with palms facing you, about shoulder-width apart.",
   "Pull up until your chin clears the bar.",
   "Lower slowly to a full hang."
  ],
  "tip": "Keep your legs still: kipping turns it into a different exercise."
 },
 {
  "name": "Weighted Pull-Up",
  "steps": [
   "Attach weight with a belt or hold a dumbbell between your feet, then hang from the bar.",
   "Pull until your chin clears the bar.",
   "Lower under control to straight arms."
  ],
  "tip": "Only add weight once you can do clean sets of 8 bodyweight pull-ups."
 },
 {
  "name": "Inverted Row",
  "steps": [
   "Lie under a bar set at hip height and grip it with straight arms.",
   "Keeping your body straight, pull your chest to the bar.",
   "Lower until your arms are straight."
  ],
  "tip": "Make it harder by walking your feet forward; easier by raising the bar."
 },
 {
  "name": "Rack Pull",
  "steps": [
   "Set the bar on safeties or blocks around knee height.",
   "Grip, brace, and stand up with the bar, locking your hips.",
   "Lower it back to the pins under control."
  ],
  "tip": "Keep the same back position you'd use for a full deadlift."
 },
 {
  "name": "Back Extension",
  "steps": [
   "Set the pad just below your hip bones and hook your feet.",
   "Lower your torso by hinging at the hips.",
   "Raise it until your body is in a straight line."
  ],
  "tip": "Stop at straight: don't hyperextend your lower back at the top."
 },
 {
  "name": "Barbell Shrug",
  "steps": [
   "Stand holding a barbell at arm's length.",
   "Raise your shoulders straight up toward your ears.",
   "Pause, then lower slowly."
  ],
  "tip": "Don't roll your shoulders; it adds nothing and strains the joint."
 },
 {
  "name": "Dumbbell Shrug",
  "steps": [
   "Stand with a dumbbell in each hand at your sides.",
   "Lift your shoulders straight up toward your ears.",
   "Hold for a second, then lower under control."
  ],
  "tip": "Keep your arms straight; the movement comes from your traps."
 },
 {
  "name": "Overhead Press",
  "steps": [
   "Hold the bar at shoulder height with hands just outside your shoulders.",
   "Press the bar straight up, moving your head back slightly to clear it.",
   "Lock out overhead with the bar over your mid-foot, then lower to your shoulders."
  ],
  "tip": "Squeeze your glutes and abs so you don't lean back."
 },
 {
  "name": "Push Press",
  "steps": [
   "Hold the bar at shoulder height and dip slightly by bending your knees.",
   "Drive up through your legs and press the bar overhead in one motion.",
   "Lower it back to your shoulders under control."
  ],
  "tip": "The dip is short and straight down: don't let your knees shoot forward."
 },
 {
  "name": "Seated Dumbbell Shoulder Press",
  "steps": [
   "Sit on an upright bench with dumbbells at shoulder height.",
   "Press the dumbbells up until your arms are straight.",
   "Lower until they're about level with your ears."
  ],
  "tip": "Keep your back against the bench and avoid arching."
 },
 {
  "name": "Arnold Press",
  "steps": [
   "Sit holding dumbbells in front of your shoulders with palms facing you.",
   "Press up while rotating your palms to face forward.",
   "Reverse the rotation as you lower back to the start."
  ],
  "tip": "Move smoothly: the rotation should finish as your arms straighten."
 },
 {
  "name": "Machine Shoulder Press",
  "steps": [
   "Adjust the seat so the handles start at shoulder height.",
   "Press the handles up until your arms are nearly straight.",
   "Lower slowly back to shoulder level."
  ],
  "tip": "Keep your back flat against the pad."
 },
 {
  "name": "Landmine Press",
  "steps": [
   "Hold the end of a landmine bar at shoulder height in a split stance.",
   "Press the bar up and forward until your arm is straight.",
   "Lower it back to your shoulder."
  ],
  "tip": "A shoulder-friendly press for anyone who struggles overhead."
 },
 {
  "name": "Dumbbell Lateral Raise",
  "steps": [
   "Stand with dumbbells at your sides and a slight bend in your elbows.",
   "Raise your arms out to the sides until they're level with your shoulders.",
   "Lower slowly."
  ],
  "tip": "Lead with your elbows and keep the weight light enough to avoid swinging."
 },
 {
  "name": "Cable Lateral Raise",
  "steps": [
   "Stand side-on to a low pulley holding the handle with your far hand.",
   "Raise your arm out to the side to shoulder height.",
   "Lower slowly back across your body."
  ],
  "tip": "The cable keeps tension at the bottom, where dumbbells go slack."
 },
 {
  "name": "Dumbbell Front Raise",
  "steps": [
   "Stand with dumbbells in front of your thighs.",
   "Raise one or both arms straight in front of you to shoulder height.",
   "Lower slowly."
  ],
  "tip": "Keep your torso still; if you have to lean back, the weight is too heavy."
 },
 {
  "name": "Rear Delt Fly",
  "steps": [
   "Hinge forward with a flat back, holding dumbbells under your chest.",
   "Raise your arms out to the sides with slightly bent elbows.",
   "Lower slowly back to the start."
  ],
  "tip": "Use light weights and think about pushing the dumbbells out, not up."
 },
 {
  "name": "Reverse Pec Deck",
  "steps": [
   "Sit facing the pec deck with handles at shoulder height.",
   "Pull your arms back and out in a wide arc.",
   "Return slowly to the front."
  ],
  "tip": "Keep your chest against the pad and shoulders down."
 },
 {
  "name": "Face Pull",
  "steps": [
   "Set a rope at upper-chest height and hold it with thumbs pointing back.",
   "Pull the rope toward your face, spreading your hands apart.",
   "Return slowly to straight arms."
  ],
  "tip": "Finish with your hands beside your ears and elbows high."
 },
 {
  "name": "Upright Row",
  "steps": [
   "Hold a barbell in front of your thighs with a shoulder-width grip.",
   "Lift the bar along your body until your elbows reach shoulder height.",
   "Lower slowly."
  ],
  "tip": "Stop at shoulder height; going higher can irritate the shoulder joint."
 },
 {
  "name": "Barbell Curl",
  "steps": [
   "Stand holding a barbell with palms forward at shoulder width.",
   "Curl the bar up toward your shoulders, keeping your elbows at your sides.",
   "Lower slowly to straight arms."
  ],
  "tip": "No swinging: if your hips move, the weight is too heavy."
 },
 {
  "name": "EZ-Bar Curl",
  "steps": [
   "Hold the angled grips of an EZ bar with arms straight.",
   "Curl the bar toward your shoulders.",
   "Lower slowly to full extension."
  ],
  "tip": "The angled grip is easier on the wrists than a straight bar."
 },
 {
  "name": "Dumbbell Curl",
  "steps": [
   "Stand with dumbbells at your sides, palms facing forward.",
   "Curl the weights up, keeping your elbows still.",
   "Lower slowly to straight arms."
  ],
  "tip": "Turn your pinkies slightly up at the top for a stronger squeeze."
 },
 {
  "name": "Hammer Curl",
  "steps": [
   "Hold dumbbells at your sides with palms facing each other.",
   "Curl up while keeping your palms facing in.",
   "Lower under control."
  ],
  "tip": "This also trains your forearms: keep your wrists straight."
 },
 {
  "name": "Incline Dumbbell Curl",
  "steps": [
   "Sit back on a bench set to about 45° with arms hanging straight down.",
   "Curl the dumbbells up without moving your upper arms.",
   "Lower slowly to a full stretch."
  ],
  "tip": "The stretched start makes this harder: use lighter weights than standing curls."
 },
 {
  "name": "Preacher Curl",
  "steps": [
   "Sit at a preacher bench with your upper arms flat on the pad.",
   "Curl the bar up toward your shoulders.",
   "Lower slowly until your arms are almost straight."
  ],
  "tip": "Control the bottom; don't let the weight yank your elbows straight."
 },
 {
  "name": "Machine Preacher Curl",
  "steps": [
   "Adjust the seat so your armpits rest on the top of the pad.",
   "Curl the handles toward your shoulders.",
   "Lower slowly to nearly straight arms."
  ],
  "tip": "Keep your upper arms on the pad the whole time."
 },
 {
  "name": "Cable Curl",
  "steps": [
   "Stand facing a low pulley holding a bar with palms up.",
   "Curl the bar toward your shoulders with elbows at your sides.",
   "Lower slowly."
  ],
  "tip": "Step back a little so the cable pulls from slightly in front of you."
 },
 {
  "name": "Concentration Curl",
  "steps": [
   "Sit with your elbow braced against the inside of your thigh.",
   "Curl the dumbbell toward your shoulder.",
   "Lower slowly to a full stretch."
  ],
  "tip": "Pause at the top and squeeze before lowering."
 },
 {
  "name": "Close-Grip Bench Press",
  "steps": [
   "Lie on the bench and grip the bar about shoulder-width apart.",
   "Lower it to your lower chest, keeping elbows close to your sides.",
   "Press back up to straight arms."
  ],
  "tip": "Shoulder-width is enough: a very narrow grip strains the wrists."
 },
 {
  "name": "Triceps Pushdown",
  "steps": [
   "Stand at a high pulley with a bar, elbows tucked at your sides.",
   "Push the bar down until your arms are straight.",
   "Let it rise slowly until your forearms are just above parallel."
  ],
  "tip": "Only your forearms move; keep your elbows pinned."
 },
 {
  "name": "Rope Pushdown",
  "steps": [
   "Hold a rope at a high pulley with elbows at your sides.",
   "Push down and spread the rope ends apart at the bottom.",
   "Return slowly."
  ],
  "tip": "Spreading the rope at the bottom gives a stronger contraction."
 },
 {
  "name": "Overhead Cable Triceps Extension",
  "steps": [
   "Face away from a pulley holding a rope behind your head.",
   "Extend your arms forward and up until they're straight.",
   "Bend your elbows slowly to return behind your head."
  ],
  "tip": "Keep your elbows pointing forward, not flaring out."
 },
 {
  "name": "Skull Crusher",
  "steps": [
   "Lie on a bench holding a bar or EZ bar over your chest with straight arms.",
   "Bend your elbows to lower the bar toward your forehead.",
   "Extend your arms back to straight."
  ],
  "tip": "Let the bar travel slightly behind your head for a better stretch."
 },
 {
  "name": "Dumbbell Overhead Triceps Extension",
  "steps": [
   "Hold one dumbbell with both hands overhead.",
   "Lower it behind your head by bending your elbows.",
   "Extend back up to straight arms."
  ],
  "tip": "Keep your ribs down so your lower back doesn't arch."
 },
 {
  "name": "Triceps Kickback",
  "steps": [
   "Hinge forward with your upper arm parallel to the floor, elbow at 90°.",
   "Straighten your arm behind you.",
   "Return slowly to 90°."
  ],
  "tip": "Keep your upper arm completely still."
 },
 {
  "name": "Triceps Dip",
  "steps": [
   "Support yourself on parallel bars with your body upright.",
   "Bend your elbows to lower until your upper arms are about parallel to the floor.",
   "Press back up to straight arms."
  ],
  "tip": "Stay upright to keep the focus on your triceps rather than your chest."
 },
 {
  "name": "Bench Dip",
  "steps": [
   "Sit on a bench edge, hands beside your hips, and slide your hips off.",
   "Bend your elbows to lower your hips toward the floor.",
   "Press back up."
  ],
  "tip": "Keep your hips close to the bench to protect your shoulders."
 },
 {
  "name": "Diamond Push-Up",
  "steps": [
   "Get into a push-up with your hands together under your chest, forming a diamond.",
   "Lower your chest toward your hands.",
   "Push back up to straight arms."
  ],
  "tip": "Keep your elbows tucked close to your body."
 },
 {
  "name": "Wrist Curl",
  "steps": [
   "Sit with forearms on your thighs, palms up, holding dumbbells past your knees.",
   "Curl your wrists up as far as they go.",
   "Lower slowly to a stretch."
  ],
  "tip": "Use light weights and a full range of motion."
 },
 {
  "name": "Reverse Wrist Curl",
  "steps": [
   "Sit with forearms on your thighs, palms down.",
   "Lift the backs of your hands toward you.",
   "Lower slowly."
  ],
  "tip": "Lighter than regular wrist curls: these muscles are smaller."
 },
 {
  "name": "Reverse Curl",
  "steps": [
   "Hold a bar with an overhand grip at shoulder width.",
   "Curl the bar up, keeping your palms facing down.",
   "Lower slowly."
  ],
  "tip": "An EZ bar makes this easier on the wrists."
 },
 {
  "name": "Farmer's Carry",
  "steps": [
   "Pick up a heavy dumbbell or kettlebell in each hand.",
   "Walk with short, steady steps, standing tall.",
   "Set the weights down with control when time is up."
  ],
  "tip": "Keep your shoulders back and down; don't let the weights pull you sideways."
 },
 {
  "name": "Dead Hang",
  "steps": [
   "Grip a pull-up bar with hands shoulder-width apart.",
   "Hang with straight arms and relaxed legs.",
   "Hold for time, then step down."
  ],
  "tip": "Great for grip and shoulder health; build up the time gradually."
 },
 {
  "name": "Back Squat",
  "steps": [
   "Rest the bar on your upper back and stand with feet about shoulder-width apart.",
   "Brace and sit down between your knees until your hips are at least level with them.",
   "Drive up through your whole foot to stand."
  ],
  "tip": "Keep your knees tracking over your toes and your chest proud."
 },
 {
  "name": "Front Squat",
  "steps": [
   "Rest the bar on the front of your shoulders with elbows high.",
   "Squat down while keeping your torso upright.",
   "Stand back up, leading with your elbows."
  ],
  "tip": "If your elbows drop, the bar rolls forward: keep them pointing ahead."
 },
 {
  "name": "Goblet Squat",
  "steps": [
   "Hold a dumbbell or kettlebell at your chest with both hands.",
   "Squat down between your knees, keeping your chest up.",
   "Stand back up through your heels."
  ],
  "tip": "Use your elbows to gently push your knees out at the bottom."
 },
 {
  "name": "Smith Machine Squat",
  "steps": [
   "Set the bar on your upper back with feet slightly in front of you.",
   "Lower until your thighs are about parallel to the floor.",
   "Push back up to standing."
  ],
  "tip": "Set the safeties first and find a foot position that feels natural."
 },
 {
  "name": "Hack Squat",
  "steps": [
   "Stand on the platform with your back against the pad and shoulders under the pads.",
   "Release the safeties and squat down as deep as is comfortable.",
   "Drive back up through your feet."
  ],
  "tip": "A lower foot placement targets the quads more."
 },
 {
  "name": "Leg Press",
  "steps": [
   "Sit with your back flat and feet shoulder-width on the platform.",
   "Lower the platform until your knees are about 90° or a little deeper.",
   "Press back up without locking your knees hard."
  ],
  "tip": "Don't let your lower back peel off the seat at the bottom."
 },
 {
  "name": "Leg Extension",
  "steps": [
   "Sit with the pad on your lower shins and knees in line with the machine's pivot.",
   "Straighten your legs until they're almost locked.",
   "Lower slowly."
  ],
  "tip": "Pause at the top and squeeze your quads."
 },
 {
  "name": "Bulgarian Split Squat",
  "steps": [
   "Stand in front of a bench and rest one foot on it behind you.",
   "Lower until your front thigh is about parallel to the floor.",
   "Push back up through your front foot."
  ],
  "tip": "Most of your weight stays on the front leg; the back foot is for balance."
 },
 {
  "name": "Walking Lunge",
  "steps": [
   "Hold dumbbells at your sides and step forward into a lunge.",
   "Lower until both knees are about 90°.",
   "Push through your front foot and step straight into the next lunge."
  ],
  "tip": "Take long enough steps that your front knee stays over your foot."
 },
 {
  "name": "Reverse Lunge",
  "steps": [
   "Stand tall, then step one foot back into a lunge.",
   "Lower until your back knee nearly touches the floor.",
   "Push through your front foot to return to standing."
  ],
  "tip": "Easier on the knees than forward lunges."
 },
 {
  "name": "Step-Up",
  "steps": [
   "Stand facing a sturdy box or bench, holding dumbbells if you like.",
   "Step up with one foot and stand up fully on the box.",
   "Step back down with control."
  ],
  "tip": "Drive through the top foot; don't push off with the back leg."
 },
 {
  "name": "Bodyweight Squat",
  "steps": [
   "Stand with feet about shoulder-width apart and arms in front.",
   "Sit down between your knees as low as you comfortably can.",
   "Stand back up."
  ],
  "tip": "Keep your heels on the floor and chest up."
 },
 {
  "name": "Jump Squat",
  "steps": [
   "Squat down to about parallel.",
   "Jump up explosively.",
   "Land softly and go straight into the next rep."
  ],
  "tip": "Land through the middle of your foot with bent knees."
 },
 {
  "name": "Wall Sit",
  "steps": [
   "Lean your back against a wall and slide down until your thighs are parallel to the floor.",
   "Keep your knees above your ankles.",
   "Hold for time."
  ],
  "tip": "Keep your back flat against the wall and breathe steadily."
 },
 {
  "name": "Romanian Deadlift",
  "steps": [
   "Stand holding a barbell at your thighs with soft knees.",
   "Push your hips back, sliding the bar down your legs until you feel a hamstring stretch.",
   "Drive your hips forward to stand back up."
  ],
  "tip": "Your back stays flat and the bar stays close; the movement is all at the hips."
 },
 {
  "name": "Dumbbell Romanian Deadlift",
  "steps": [
   "Hold dumbbells in front of your thighs with soft knees.",
   "Hinge at the hips, lowering the dumbbells along your legs.",
   "Stand back up by driving your hips forward."
  ],
  "tip": "Stop when your hips stop moving back, usually around mid-shin."
 },
 {
  "name": "Single-Leg Romanian Deadlift",
  "steps": [
   "Stand on one leg holding a dumbbell in the opposite hand.",
   "Hinge forward, letting your free leg rise behind you.",
   "Return to standing."
  ],
  "tip": "Keep your hips level: imagine your belt buckle pointing at the floor."
 },
 {
  "name": "Stiff-Leg Deadlift",
  "steps": [
   "Stand with the bar at your thighs and knees only slightly bent.",
   "Hinge forward, lowering the bar toward your feet.",
   "Return to standing."
  ],
  "tip": "Go only as low as your flexibility allows with a flat back."
 },
 {
  "name": "Good Morning",
  "steps": [
   "Rest a barbell on your upper back as for a squat.",
   "Hinge forward at the hips with soft knees until your torso is near parallel.",
   "Return to standing."
  ],
  "tip": "Start light; this loads the lower back and hamstrings a lot."
 },
 {
  "name": "Lying Leg Curl",
  "steps": [
   "Lie face down with the pad just above your heels.",
   "Curl your heels toward your glutes.",
   "Lower slowly."
  ],
  "tip": "Keep your hips pressed into the bench."
 },
 {
  "name": "Seated Leg Curl",
  "steps": [
   "Sit with the pad on your lower calves and the thigh pad locked down.",
   "Curl your legs down and back.",
   "Return slowly."
  ],
  "tip": "Lean slightly forward to increase the stretch on your hamstrings."
 },
 {
  "name": "Nordic Hamstring Curl",
  "steps": [
   "Kneel with your heels anchored under a pad or by a partner.",
   "Lower your body forward slowly, keeping hips straight.",
   "Catch yourself with your hands and push back up."
  ],
  "tip": "Lower as slowly as you can: that's where the benefit is."
 },
 {
  "name": "Barbell Hip Thrust",
  "steps": [
   "Sit with your upper back against a bench and a padded bar over your hips.",
   "Drive through your heels to lift your hips until your body is straight from shoulders to knees.",
   "Lower your hips under control."
  ],
  "tip": "Tuck your chin and keep your ribs down at the top."
 },
 {
  "name": "Glute Bridge",
  "steps": [
   "Lie on your back with knees bent and feet flat.",
   "Squeeze your glutes to lift your hips.",
   "Lower slowly."
  ],
  "tip": "Push through your heels and pause at the top."
 },
 {
  "name": "Sumo Deadlift",
  "steps": [
   "Take a wide stance with toes turned out and grip the bar inside your knees.",
   "Push the floor apart with your feet and stand up with the bar.",
   "Lower the bar back down under control."
  ],
  "tip": "Keep your chest up and your knees pushed out over your toes."
 },
 {
  "name": "Cable Glute Kickback",
  "steps": [
   "Attach an ankle strap to a low pulley and face the machine.",
   "Kick your leg straight back, squeezing your glute.",
   "Return slowly."
  ],
  "tip": "Don't arch your back to get the leg higher."
 },
 {
  "name": "Hip Abduction Machine",
  "steps": [
   "Sit with the pads on the outside of your knees.",
   "Push your knees apart as far as you can.",
   "Return slowly."
  ],
  "tip": "Lean slightly forward to bias the glutes."
 },
 {
  "name": "Cable Pull-Through",
  "steps": [
   "Face away from a low pulley holding a rope between your legs.",
   "Hinge forward at the hips, letting the rope pull back.",
   "Stand up by squeezing your glutes."
  ],
  "tip": "A great way to learn the hip hinge before deadlifting."
 },
 {
  "name": "Kettlebell Swing",
  "steps": [
   "Stand with feet wider than shoulders and a kettlebell on the floor in front.",
   "Hike it back between your legs, then snap your hips forward to swing it to chest height.",
   "Let it fall back and hinge into the next rep."
  ],
  "tip": "The power comes from your hips; your arms just guide the bell."
 },
 {
  "name": "Standing Calf Raise",
  "steps": [
   "Stand on the edge of the platform with shoulders under the pads.",
   "Rise up onto your toes as high as you can.",
   "Lower slowly until your heels are below the platform."
  ],
  "tip": "Pause at the bottom stretch; bouncing wastes the rep."
 },
 {
  "name": "Seated Calf Raise",
  "steps": [
   "Sit with the pad on your thighs and balls of your feet on the platform.",
   "Raise your heels as high as possible.",
   "Lower slowly into a deep stretch."
  ],
  "tip": "Seated calf raises target the lower calf muscle."
 },
 {
  "name": "Leg Press Calf Raise",
  "steps": [
   "Sit in a leg press with the balls of your feet on the bottom of the platform.",
   "Press the platform away by pointing your toes.",
   "Return slowly."
  ],
  "tip": "Keep your knees straight but not locked."
 },
 {
  "name": "Single-Leg Calf Raise",
  "steps": [
   "Stand on one foot on a step, holding something for balance.",
   "Rise up onto your toes.",
   "Lower slowly below the step."
  ],
  "tip": "Hold a dumbbell when bodyweight gets easy."
 },
 {
  "name": "Plank",
  "steps": [
   "Rest on your forearms and toes with elbows under your shoulders.",
   "Form a straight line from head to heels.",
   "Hold for time."
  ],
  "tip": "Squeeze your glutes and brace like you're about to be poked in the stomach."
 },
 {
  "name": "Side Plank",
  "steps": [
   "Lie on your side and prop yourself up on one forearm.",
   "Lift your hips so your body forms a straight line.",
   "Hold, then switch sides."
  ],
  "tip": "Stack your hips and don't let them drop toward the floor."
 },
 {
  "name": "Hollow Hold",
  "steps": [
   "Lie on your back and press your lower back into the floor.",
   "Lift your shoulders and legs off the floor with arms overhead.",
   "Hold for time."
  ],
  "tip": "If your lower back lifts, bend your knees or bring your arms in."
 },
 {
  "name": "Hanging Leg Raise",
  "steps": [
   "Hang from a bar with straight arms.",
   "Raise your legs until they're at least parallel to the floor.",
   "Lower slowly without swinging."
  ],
  "tip": "Curl your pelvis up at the top to really work your abs."
 },
 {
  "name": "Hanging Knee Raise",
  "steps": [
   "Hang from a bar with straight arms.",
   "Bring your knees up toward your chest.",
   "Lower slowly."
  ],
  "tip": "A good stepping stone to hanging leg raises."
 },
 {
  "name": "Lying Leg Raise",
  "steps": [
   "Lie on your back with legs straight and hands under your hips.",
   "Raise your legs to vertical.",
   "Lower slowly without letting your lower back arch."
  ],
  "tip": "Stop just before your heels touch the floor."
 },
 {
  "name": "Cable Crunch",
  "steps": [
   "Kneel facing a high pulley holding a rope beside your head.",
   "Crunch down, bringing your elbows toward your thighs.",
   "Return slowly."
  ],
  "tip": "Your hips stay still; the movement comes from rounding your spine."
 },
 {
  "name": "Crunch",
  "steps": [
   "Lie on your back with knees bent and hands lightly behind your head.",
   "Curl your shoulders off the floor.",
   "Lower slowly."
  ],
  "tip": "Don't pull on your neck; your hands are just there for support."
 },
 {
  "name": "Bicycle Crunch",
  "steps": [
   "Lie on your back with hands behind your head and legs raised.",
   "Bring one elbow toward the opposite knee while straightening the other leg.",
   "Alternate sides in a pedalling motion."
  ],
  "tip": "Slow and controlled beats fast and sloppy."
 },
 {
  "name": "Sit-Up",
  "steps": [
   "Lie on your back with knees bent and feet anchored.",
   "Sit all the way up.",
   "Lower back down under control."
  ],
  "tip": "Exhale on the way up."
 },
 {
  "name": "Decline Sit-Up",
  "steps": [
   "Hook your feet on a decline bench and lie back.",
   "Sit up until your torso is upright.",
   "Lower slowly."
  ],
  "tip": "Hold a plate on your chest to add difficulty."
 },
 {
  "name": "Ab Wheel Rollout",
  "steps": [
   "Kneel holding an ab wheel under your shoulders.",
   "Roll forward slowly, keeping your core braced.",
   "Pull back to the start using your abs."
  ],
  "tip": "Only roll as far as you can without your lower back sagging."
 },
 {
  "name": "Russian Twist",
  "steps": [
   "Sit with knees bent and lean back slightly with your feet up or on the floor.",
   "Rotate your torso to touch the floor on one side.",
   "Rotate to the other side."
  ],
  "tip": "Move from your ribcage, not just your arms."
 },
 {
  "name": "Pallof Press",
  "steps": [
   "Stand side-on to a cable at chest height, holding the handle at your chest.",
   "Press the handle straight out in front of you.",
   "Hold briefly and bring it back."
  ],
  "tip": "Resist the cable pulling you round: that's the exercise."
 },
 {
  "name": "Dead Bug",
  "steps": [
   "Lie on your back with arms up and knees bent at 90° above your hips.",
   "Lower one arm and the opposite leg toward the floor.",
   "Return and switch sides."
  ],
  "tip": "Keep your lower back pressed into the floor the whole time."
 },
 {
  "name": "Bird Dog",
  "steps": [
   "Start on hands and knees.",
   "Extend one arm forward and the opposite leg back.",
   "Return and switch sides."
  ],
  "tip": "Keep your hips level, as if balancing a cup on your lower back."
 },
 {
  "name": "Mountain Climber",
  "steps": [
   "Start in a high plank.",
   "Drive one knee toward your chest, then switch legs quickly.",
   "Keep going for time."
  ],
  "tip": "Keep your hips low and shoulders over your hands."
 },
 {
  "name": "Power Clean",
  "steps": [
   "Start like a deadlift with the bar over your mid-foot.",
   "Pull explosively, extending your hips and shrugging, then drop under to catch the bar on your shoulders.",
   "Stand up fully, then lower the bar safely."
  ],
  "tip": "Learn this with an empty bar or a coach; technique matters more than load."
 },
 {
  "name": "Hang Clean",
  "steps": [
   "Stand with the bar at your thighs and hinge slightly to just above the knees.",
   "Jump and shrug explosively, then catch the bar on your shoulders in a quarter squat.",
   "Stand up and return the bar to your thighs."
  ],
  "tip": "Keep the bar close to your body as it rises."
 },
 {
  "name": "Barbell Thruster",
  "steps": [
   "Hold a barbell on your front shoulders as for a front squat.",
   "Squat down, then drive up and press the bar overhead in one motion.",
   "Lower the bar to your shoulders and go into the next rep."
  ],
  "tip": "Use your legs to drive the bar; the press finishes the movement."
 },
 {
  "name": "Dumbbell Snatch",
  "steps": [
   "Squat down and grip a dumbbell between your feet.",
   "Explode up and pull the dumbbell overhead in one motion, punching your arm straight.",
   "Lower it back to the floor with control."
  ],
  "tip": "Keep the dumbbell close to your body as it travels up."
 },
 {
  "name": "Turkish Get-Up",
  "steps": [
   "Lie on your back holding a kettlebell straight up in one hand.",
   "Stand up in stages, keeping the weight locked out overhead.",
   "Reverse the steps to lie back down."
  ],
  "tip": "Keep your eyes on the weight throughout."
 },
 {
  "name": "Burpee",
  "steps": [
   "From standing, squat and place your hands on the floor.",
   "Jump your feet back to a plank, do a push-up, then jump your feet forward.",
   "Jump up with your arms overhead."
  ],
  "tip": "Keep a steady pace you can sustain rather than sprinting the first few."
 },
 {
  "name": "Sled Push",
  "steps": [
   "Grip the sled handles with arms extended and lean forward.",
   "Drive the sled forward with short, powerful steps.",
   "Keep going for the set time or distance."
  ],
  "tip": "Stay low and push through the balls of your feet."
 },
 {
  "name": "Battle Ropes",
  "steps": [
   "Hold a rope end in each hand with knees bent.",
   "Make waves by moving your arms up and down quickly.",
   "Keep going for time."
  ],
  "tip": "Power comes from your hips and core, not just your arms."
 },
 {
  "name": "Treadmill Run",
  "steps": [
   "Start with a few minutes at an easy pace to warm up.",
   "Run at your target pace or incline for the planned time.",
   "Cool down at a walk."
  ],
  "tip": "Run tall and land under your hips, not out in front."
 },
 {
  "name": "Outdoor Run",
  "steps": [
   "Warm up with a few minutes of easy jogging.",
   "Run at a conversational pace unless doing intervals.",
   "Finish with a few minutes of walking."
  ],
  "tip": "Build distance gradually: around 10% more per week."
 },
 {
  "name": "Walking",
  "steps": [
   "Walk at a brisk pace where talking is possible but slightly harder.",
   "Swing your arms naturally.",
   "Keep going for the planned time."
  ],
  "tip": "Adding hills or a weighted vest increases the challenge."
 },
 {
  "name": "Stationary Bike",
  "steps": [
   "Set the seat so your knee is slightly bent at the bottom of the stroke.",
   "Pedal at a steady pace or follow intervals.",
   "Cool down with easy pedalling."
  ],
  "tip": "Keep your upper body relaxed and still."
 },
 {
  "name": "Air Bike",
  "steps": [
   "Sit with feet on the pedals and hands on the moving handles.",
   "Push and pull with your arms while pedalling.",
   "Go hard for intervals or steady for longer efforts."
  ],
  "tip": "The harder you work, the more resistance there is."
 },
 {
  "name": "Rowing Machine",
  "steps": [
   "Strap your feet in and grab the handle with straight arms.",
   "Drive with your legs, then lean back slightly and pull the handle to your lower ribs.",
   "Return in reverse: arms, body, then legs."
  ],
  "tip": "Legs first, then back, then arms; most of the power is your legs."
 },
 {
  "name": "Elliptical",
  "steps": [
   "Step on and hold the handles.",
   "Move in a smooth, steady stride.",
   "Adjust resistance to keep it challenging."
  ],
  "tip": "Push and pull the handles to involve your upper body."
 },
 {
  "name": "Stair Climber",
  "steps": [
   "Step on and hold the rails lightly.",
   "Climb at a steady pace.",
   "Keep going for the planned time."
  ],
  "tip": "Don't lean on the rails; let your legs do the work."
 },
 {
  "name": "Jump Rope",
  "steps": [
   "Hold the handles at hip height with the rope behind you.",
   "Swing the rope over your head and jump as it passes under your feet.",
   "Keep a steady rhythm."
  ],
  "tip": "Small, quick jumps on the balls of your feet are enough."
 },
 {
  "name": "Swimming",
  "steps": [
   "Warm up with a few easy lengths.",
   "Swim your main set at a steady effort, resting at the wall as needed.",
   "Finish with an easy length or two."
  ],
  "tip": "Breathe out steadily underwater so you're ready to breathe in."
 }
]$json$;
  g jsonb;
  v_updated integer := 0;
begin
  for g in select * from jsonb_array_elements(spec) loop
    update public.exercises
    set instructions = (select string_agg(s, E'\n' order by ord) from jsonb_array_elements_text(g -> 'steps') with ordinality as t(s, ord)),
        form_tip = g ->> 'tip'
    where owner_id is null and name = g ->> 'name';
    if not found then raise exception 'No built-in exercise named "%"', g ->> 'name'; end if;
    v_updated := v_updated + 1;
  end loop;
  raise notice 'exercise guides written: %', v_updated;
end $$;
