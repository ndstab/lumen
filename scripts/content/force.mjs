/**
 * Force, Pressure and Motion.
 * Aligned to NCERT Class 8 chapter 11 and Class 9 motion.
 */

export const force = {
  slug: "force",
  title: "Force and Motion",
  subtitle: "Pushes, pulls, pressure and speed",
  subject: "Physics",
  gradeBand: "Classes 8 and 9",
  description:
    "A force is nothing more exotic than a push or a pull, but it is the reason anything ever starts moving, stops, turns or changes shape. This course covers what forces do, why the same force can be gentle or devastating depending on the area it acts over, and how to describe motion precisely enough to calculate it.",

  lessons: [
    /* ------------------------------------------------------------------ 1 */
    {
      slug: "what-a-force-does",
      title: "What a force actually does",
      summary:
        "Four things can happen when a force acts, and every physical situation you will meet is some combination of them.",
      readingMinutes: 5,
      video: { title: "Contact and non-contact forces", durationS: 94 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "A force is a push or a pull on an object. You cannot see one directly. You only ever see what it does, which is why forces are defined by their effects.",
        },
        {
          kind: "figure",
          content: "force-effects",
          caption:
            "Fig 1.1  The four effects of a force: starting motion, stopping motion, changing direction, and changing shape.",
        },
        { kind: "heading", content: "The four effects" },
        {
          kind: "list",
          content: [
            "A force can make a stationary object start moving, such as kicking a stationary ball.",
            "A force can make a moving object stop or slow down, such as a brake on a bicycle wheel.",
            "A force can change the direction of a moving object, such as a batsman deflecting a ball.",
            "A force can change the shape or size of an object, such as squeezing a sponge or stretching a rubber band.",
          ],
        },
        {
          kind: "callout",
          content:
            "The first three are all changes to the state of motion. Speed and direction together are what physicists mean by that phrase, so changing either one counts.",
        },
        { kind: "heading", content: "Contact and non-contact" },
        {
          kind: "paragraph",
          content:
            "Some forces need the two objects to touch. Muscular force, when you push a door, and friction, which opposes sliding, are contact forces. Others act across a gap with nothing in between. Magnetic force, electrostatic force and gravitational force are non-contact forces. A dropped stone falls without anything touching it, and a magnet moves a pin from a distance.",
        },
        { kind: "heading", content: "Forces add up" },
        {
          kind: "paragraph",
          content:
            "When two forces act on the same object in the same direction, the net force is their sum. When they act in opposite directions, the net force is the difference, and it points the way the larger force does. If two equal forces act in opposite directions, the net force is zero and the state of motion does not change. That is what happens in a tug of war that nobody is winning: enormous forces, no movement.",
        },
      ],
      questions: [
        {
          kind: "multi",
          prompt: "Select every effect a force can produce.",
          explanation:
            "A force can start motion, stop motion, change direction, and change an object's shape. All four are standard effects of a force.",
          options: [
            ["Make a stationary object move", true],
            ["Slow down or stop a moving object", true],
            ["Change the direction of motion", true],
            ["Change the shape of an object", true],
          ],
        },
        {
          kind: "mcq",
          prompt: "Which of these is a non-contact force?",
          explanation:
            "Gravitational force acts across a gap with no contact between the objects. Friction, muscular force and the push of your hand all need contact.",
          options: [
            ["Gravitational force", true],
            ["Friction", false],
            ["Muscular force", false],
            ["The push of your hand on a door", false],
          ],
        },
        {
          kind: "numeric",
          prompt:
            "Two people push a box in the same direction with forces of 25 newtons and 40 newtons. What is the net force on the box, in newtons?",
          answer: 65,
          tolerance: 0.5,
          unit: "newtons",
          explanation:
            "Forces in the same direction add: 25 plus 40 gives 65 newtons.",
        },
        {
          kind: "numeric",
          prompt:
            "In a tug of war one team pulls with 320 newtons and the other with 290 newtons in the opposite direction. What is the net force, in newtons?",
          answer: 30,
          tolerance: 0.5,
          unit: "newtons",
          explanation:
            "Forces in opposite directions subtract: 320 minus 290 gives 30 newtons, acting in the direction of the stronger team.",
        },
        {
          kind: "mcq",
          prompt:
            "A ball is rolling on level ground and gradually slows to a stop. Which force is responsible?",
          explanation:
            "Friction between the ball and the ground opposes the motion and removes energy, bringing the ball to rest.",
          options: [
            ["Friction", true],
            ["Magnetic force", false],
            ["Electrostatic force", false],
            ["Muscular force", false],
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ 2 */
    {
      slug: "pressure",
      title: "The same force, spread differently",
      summary:
        "Why a drawing pin goes into a board but your thumb does not, using exactly the same push.",
      readingMinutes: 5,
      video: { title: "Force, area and why sharp things work", durationS: 88 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "Press a drawing pin into a noticeboard. Your thumb feels a comfortable push. The point goes straight in. The same force is acting at both ends of the pin, so the difference cannot be the force. It is the area.",
        },
        { kind: "heading", content: "The definition" },
        {
          kind: "paragraph",
          content:
            "Pressure is the force acting perpendicular to a surface divided by the area of that surface. Written as a formula, pressure equals force divided by area. Force is measured in newtons and area in square metres, so pressure comes out in newtons per square metre, which is given the name pascal.",
        },
        {
          kind: "figure",
          content: "pressure-area",
          caption:
            "Fig 2.1  The same 50 newton force on two different areas. Ten times less area gives ten times the pressure.",
        },
        {
          kind: "callout",
          content:
            "Because area is on the bottom of the fraction, halving the area doubles the pressure. This one fact explains sharp knives, wide tractor tyres, camel feet and why walking on snow is easier with snowshoes.",
        },
        { kind: "heading", content: "Making pressure large or small on purpose" },
        {
          kind: "list",
          content: [
            "To increase pressure, reduce the area. Knives, needles, nails and the studs on a football boot all end in a small area so a modest force produces a large pressure.",
            "To decrease pressure, increase the area. Tractor tyres are wide, school bags have broad straps, and foundations of buildings spread out below the walls, all so a large force produces a manageable pressure.",
          ],
        },
        {
          kind: "paragraph",
          content:
            "A camel is a good example of the second. It is heavy, but its feet spread out on contact with sand, increasing the area and lowering the pressure enough to stop it sinking.",
        },
      ],
      questions: [
        {
          kind: "numeric",
          prompt:
            "A force of 60 newtons acts on an area of 0.5 square metres. What is the pressure, in pascals?",
          answer: 120,
          tolerance: 1,
          unit: "pascals",
          explanation:
            "Pressure equals force divided by area: 60 divided by 0.5 gives 120 pascals.",
        },
        {
          kind: "numeric",
          prompt:
            "A box weighing 200 newtons rests on the ground with a base area of 0.4 square metres. What pressure does it exert, in pascals?",
          answer: 500,
          tolerance: 2,
          unit: "pascals",
          explanation:
            "Pressure equals force divided by area: 200 divided by 0.4 gives 500 pascals.",
        },
        {
          kind: "mcq",
          prompt: "The area a force acts on is halved, while the force stays the same. What happens to the pressure?",
          explanation:
            "Area is in the denominator, so halving it doubles the pressure.",
          options: [
            ["It doubles", true],
            ["It halves", false],
            ["It stays the same", false],
            ["It becomes four times larger", false],
          ],
        },
        {
          kind: "multi",
          prompt: "Select every example that works by deliberately reducing pressure.",
          explanation:
            "Wide tractor tyres, broad school bag straps and wide building foundations all increase the contact area to lower the pressure. A sharp knife does the opposite: it reduces area to raise pressure.",
          options: [
            ["Wide tractor tyres", true],
            ["Broad straps on a school bag", true],
            ["Wide foundations under a building wall", true],
            ["The sharp edge of a knife", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "What is the unit of pressure?",
          explanation:
            "Pressure is force divided by area, giving newtons per square metre, which is named the pascal.",
          options: [
            ["Pascal", true],
            ["Newton", false],
            ["Joule", false],
            ["Watt", false],
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ 3 */
    {
      slug: "pressure-in-fluids",
      title: "Pressure in liquids and air",
      summary:
        "Liquids push sideways as well as down, and you are currently under about ten tonnes of atmosphere.",
      readingMinutes: 5,
      video: { title: "Jets from a punctured bottle", durationS: 102 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "A solid block resting on a table pushes down and only down. A liquid is different. Its particles move freely, so it presses on every surface it touches: the bottom of the container, the sides, and anything submerged in it, from every direction at once.",
        },
        {
          kind: "figure",
          content: "liquid-pressure",
          caption:
            "Fig 3.1  Water escaping from holes at three depths. The lowest jet travels furthest, because the pressure there is greatest.",
        },
        { kind: "heading", content: "What liquid pressure depends on" },
        {
          kind: "list",
          content: [
            "Depth. The deeper you go, the more liquid there is above pressing down, so the pressure is greater. This is why a dam is built much thicker at its base than at its top.",
            "Density. A denser liquid produces more pressure at the same depth. Mercury exerts far more pressure than water at the same depth.",
            "Not the shape of the container, and not the total amount of liquid. Only the depth and the density matter.",
          ],
        },
        {
          kind: "callout",
          content:
            "Punch three holes down the side of a filled bottle and the lowest jet shoots out furthest. That single observation demonstrates both that liquids press sideways and that the pressure grows with depth.",
        },
        { kind: "heading", content: "Atmospheric pressure" },
        {
          kind: "paragraph",
          content:
            "Air has weight, and the column of air above you reaches to the edge of the atmosphere. At sea level it presses with about 100000 pascals, which works out to roughly 10 newtons on every square centimetre. The reason you are not crushed is that the pressure inside your body pushes outwards by the same amount, so the two balance.",
        },
        {
          kind: "paragraph",
          content:
            "Take the air out of a sealed tin and there is nothing left to push back, so the atmosphere crushes it flat. Climb a mountain and there is less air above you, so atmospheric pressure falls. A rubber sucker works the same way: squeeze the air out and the outside atmosphere holds it against the wall.",
        },
      ],
      questions: [
        {
          kind: "mcq",
          prompt: "Three holes are made at different heights in a bottle full of water. Which jet travels furthest?",
          explanation:
            "The lowest hole, because pressure in a liquid increases with depth and the greater pressure pushes the water out faster.",
          options: [
            ["The lowest hole", true],
            ["The highest hole", false],
            ["The middle hole", false],
            ["All three travel the same distance", false],
          ],
        },
        {
          kind: "multi",
          prompt: "Select everything that affects the pressure at a point inside a liquid.",
          explanation:
            "Only depth and the density of the liquid matter. The shape of the container and the total volume of liquid make no difference at all.",
          options: [
            ["The depth below the surface", true],
            ["The density of the liquid", true],
            ["The shape of the container", false],
            ["The total volume of liquid present", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Why is a dam built much thicker at the bottom than at the top?",
          explanation:
            "Water pressure increases with depth, so the wall must be strongest where the pressure pushing against it is greatest.",
          options: [
            ["Water pressure is greatest at the bottom", true],
            ["The water is colder at the bottom", false],
            ["To make the dam look more stable", false],
            ["Because water is denser at the top", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Why are we not crushed by atmospheric pressure?",
          explanation:
            "The pressure of the fluids inside the body pushes outwards with the same magnitude, so the inward and outward pressures balance.",
          options: [
            ["The pressure inside our bodies pushes outwards by the same amount", true],
            ["Our skin is strong enough to resist it completely", false],
            ["Atmospheric pressure only acts downwards, not on people", false],
            ["Air is too light to exert any pressure", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "What happens to atmospheric pressure as you climb a mountain?",
          explanation:
            "There is less air above you at higher altitude, so the column of air pressing down is shorter and the pressure falls.",
          options: [
            ["It decreases", true],
            ["It increases", false],
            ["It stays exactly the same", false],
            ["It drops to zero", false],
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ 4 */
    {
      slug: "describing-motion",
      title: "Describing motion with numbers",
      summary:
        "Speed, distance and time, and how to read the story of a journey off a graph.",
      readingMinutes: 6,
      video: { title: "Reading a distance time graph", durationS: 116 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "Saying a car is fast is not physics. Saying it covers 20 metres every second is. Speed is the distance travelled divided by the time taken, and its unit is metres per second.",
        },
        { kind: "heading", content: "Uniform and non-uniform motion" },
        {
          kind: "paragraph",
          content:
            "Motion is uniform when equal distances are covered in equal intervals of time, however small the intervals. Real journeys are almost never like this, which is why average speed is more useful: total distance divided by total time. A bus that averages 40 kilometres per hour has still stopped, crawled and sped up along the way.",
        },
        {
          kind: "figure",
          content: "distance-time",
          caption:
            "Fig 4.1  A distance time graph. The steeper the line, the faster the motion. A horizontal line means the object is at rest.",
        },
        { kind: "heading", content: "Reading the graph" },
        {
          kind: "list",
          content: [
            "A straight sloping line means uniform speed.",
            "The steeper the slope, the greater the speed.",
            "A horizontal line means the distance is not changing, so the object is stationary.",
            "A curved line means the speed is changing, which is non-uniform motion.",
          ],
        },
        {
          kind: "callout",
          content:
            "To convert kilometres per hour into metres per second, divide by 3.6. To go the other way, multiply by 3.6. A speed of 72 kilometres per hour is 20 metres per second.",
        },
        { kind: "heading", content: "Distance and displacement" },
        {
          kind: "paragraph",
          content:
            "Distance is the total path length covered, and it never decreases. Displacement is the straight line from start to finish, and it has a direction. Run one full lap of a track and you have covered a distance of 400 metres but your displacement is zero, because you finished exactly where you began.",
        },
      ],
      questions: [
        {
          kind: "numeric",
          prompt:
            "A cyclist covers 150 metres in 30 seconds. What is the speed, in metres per second?",
          answer: 5,
          tolerance: 0.05,
          unit: "metres per second",
          explanation:
            "Speed equals distance divided by time: 150 divided by 30 gives 5 metres per second.",
        },
        {
          kind: "numeric",
          prompt:
            "A car travels at 72 kilometres per hour. What is this speed in metres per second?",
          answer: 20,
          tolerance: 0.2,
          unit: "metres per second",
          explanation:
            "Divide by 3.6 to convert kilometres per hour into metres per second: 72 divided by 3.6 gives 20 metres per second.",
        },
        {
          kind: "mcq",
          prompt: "On a distance time graph, what does a horizontal line mean?",
          explanation:
            "The distance is not changing as time passes, so the object is not moving.",
          options: [
            ["The object is at rest", true],
            ["The object is moving at constant speed", false],
            ["The object is speeding up", false],
            ["The object is moving backwards", false],
          ],
        },
        {
          kind: "numeric",
          prompt:
            "A runner completes one full lap of a 400 metre track and returns to the starting point. What is the magnitude of the displacement, in metres?",
          answer: 0,
          tolerance: 0.01,
          unit: "metres",
          explanation:
            "Displacement is the straight line distance from start to finish. The runner finished where they started, so the displacement is zero even though the distance covered was 400 metres.",
        },
        {
          kind: "mcq",
          prompt: "What does a steeper line on a distance time graph tell you?",
          explanation:
            "The slope of a distance time graph is the speed, so a steeper line means more distance covered per unit time, which is a greater speed.",
          options: [
            ["The object is moving faster", true],
            ["The object is moving slower", false],
            ["The object has stopped", false],
            ["The object is heavier", false],
          ],
        },
      ],
    },
  ],
};
