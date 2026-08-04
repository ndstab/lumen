/**
 * Light: reflection, refraction and the human eye.
 * Aligned to NCERT Class 8 chapter 16 and Class 9 to 10 optics.
 */

export const light = {
  slug: "light",
  title: "Light",
  subtitle: "Reflection, refraction and the human eye",
  subject: "Physics",
  gradeBand: "Classes 8 and 9",
  description:
    "Light travels in straight lines until something gets in the way. This course follows what happens at that moment: how it bounces off a mirror, how it bends going into glass or water, where a lens gathers it back together, and how your own eye does the same job every waking second.",

  lessons: [
    /* ------------------------------------------------------------------ 1 */
    {
      slug: "laws-of-reflection",
      title: "How light bounces",
      summary:
        "Two rules govern every mirror, every puddle and every polished surface you have ever looked into.",
      readingMinutes: 5,
      video: { title: "Measuring the angle of reflection", durationS: 96 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "Point a narrow beam of light at a mirror and it leaves again in one specific direction. Not scattered, not random. Move the mirror a degree and the reflected beam moves too, predictably. That predictability is what makes mirrors useful, and it is described completely by two rules.",
        },
        {
          kind: "heading",
          content: "The vocabulary you need first",
        },
        {
          kind: "list",
          content: [
            "The incident ray is the light arriving at the surface.",
            "The reflected ray is the light leaving it.",
            "The normal is an imaginary line drawn at right angles to the surface, exactly where the light lands.",
            "The angle of incidence, written i, is measured between the incident ray and the normal. Not between the ray and the mirror.",
            "The angle of reflection, written r, is measured between the reflected ray and the normal.",
          ],
        },
        {
          kind: "callout",
          content:
            "Angles are always measured from the normal, never from the surface. Almost every wrong answer in this topic comes from measuring against the mirror instead.",
        },
        {
          kind: "figure",
          content: "reflection-law",
          caption:
            "Fig 1.1  The incident ray, the normal and the reflected ray. The two angles marked are always equal.",
        },
        { kind: "heading", content: "The two laws" },
        {
          kind: "list",
          content: [
            "First law: the angle of incidence equals the angle of reflection. If light arrives at 35 degrees to the normal, it leaves at 35 degrees on the other side.",
            "Second law: the incident ray, the reflected ray and the normal all lie in the same plane. Light does not skew sideways out of that plane.",
          ],
        },
        {
          kind: "paragraph",
          content:
            "The second law sounds obvious until you try to draw it. It is the reason a reflection stays lined up with the object rather than drifting off to one side.",
        },
        { kind: "heading", content: "Why a wall has no reflection" },
        {
          kind: "paragraph",
          content:
            "Both laws hold at every single point of a wall, a sheet of paper and a mirror alike. The difference is flatness. A mirror is smooth at the scale of light, so neighbouring rays keep their arrangement and an image survives. A wall is rough at that scale, so each tiny patch faces a slightly different way and sends its ray off at a different angle. That is diffuse reflection, and it is why you can see the wall from anywhere in the room but cannot see yourself in it.",
        },
      ],
      questions: [
        {
          kind: "numeric",
          prompt:
            "A ray strikes a plane mirror at 32 degrees to the normal. What is the angle of reflection, in degrees?",
          answer: 32,
          tolerance: 0.5,
          unit: "degrees",
          explanation:
            "The first law of reflection: the angle of reflection equals the angle of incidence. Both are measured from the normal, so the answer is 32 degrees.",
        },
        {
          kind: "numeric",
          prompt:
            "A ray hits a mirror at 20 degrees to the mirror surface. What is the angle of incidence, in degrees?",
          answer: 70,
          tolerance: 0.5,
          unit: "degrees",
          explanation:
            "The angle of incidence is measured from the normal, not from the surface. The normal is at right angles to the mirror, so the angle of incidence is 90 minus 20, which is 70 degrees.",
        },
        {
          kind: "mcq",
          prompt: "Why can you see a sheet of white paper from anywhere in the room?",
          explanation:
            "The laws of reflection still hold at each point. The paper is rough at the scale of light, so different points reflect in different directions and light reaches your eye wherever you stand. This is diffuse reflection.",
          options: [
            ["Its rough surface reflects light in many directions at once", true],
            ["Paper does not obey the laws of reflection", false],
            ["Paper produces its own light", false],
            ["Light passes through paper and back out again", false],
          ],
        },
        {
          kind: "multi",
          prompt: "Select every statement that is true of regular reflection from a plane mirror.",
          explanation:
            "The angles are equal, and the incident ray, reflected ray and normal share a plane. The angle is measured from the normal, and the laws apply to rough surfaces too, which is precisely why rough surfaces scatter.",
          options: [
            ["The angle of incidence equals the angle of reflection", true],
            ["The incident ray, reflected ray and normal lie in one plane", true],
            ["Angles are measured between the ray and the mirror surface", false],
            ["The laws of reflection fail on rough surfaces", false],
          ],
        },
        {
          kind: "mcq",
          prompt:
            "A ray travels along the normal and strikes a mirror head on. What happens to it?",
          explanation:
            "The angle of incidence is zero, so the angle of reflection is zero as well. The ray retraces its own path straight back.",
          options: [
            ["It reflects straight back along the same path", true],
            ["It is absorbed completely", false],
            ["It reflects at 90 degrees to its original path", false],
            ["It continues through the mirror without changing direction", false],
          ],
        },
        {
          kind: "numeric",
          prompt:
            "A mirror is rotated by 10 degrees while the incident ray stays fixed. By how many degrees does the reflected ray turn?",
          answer: 20,
          tolerance: 0.5,
          unit: "degrees",
          explanation:
            "Rotating the mirror by an angle turns the normal by the same angle, which changes the angle of incidence by that amount and the angle of reflection by that amount as well. The reflected ray therefore turns by twice the rotation, giving 20 degrees.",
        },
      ],
    },

    /* ------------------------------------------------------------------ 2 */
    {
      slug: "plane-mirrors",
      title: "The image behind the glass",
      summary:
        "Your reflection is standing exactly as far behind the mirror as you are in front of it, and it is not really there at all.",
      readingMinutes: 5,
      video: { title: "Why your reflection swaps left and right", durationS: 104 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "Stand a metre from a mirror and your reflection looks a metre beyond the glass. Step back and it retreats at exactly your pace. Something is clearly there. Put your hand behind the mirror and there is nothing at all.",
        },
        {
          kind: "heading",
          content: "Real and virtual images",
        },
        {
          kind: "paragraph",
          content:
            "A real image is formed where light rays actually meet. You can catch one on a screen. A virtual image is formed where rays only appear to have come from, once your brain extends them backwards in straight lines. No light ever reaches that point, so no screen will ever catch it. Everything you have ever seen in a plane mirror is virtual.",
        },
        {
          kind: "figure",
          content: "plane-mirror",
          caption:
            "Fig 2.1  Solid lines are real light paths. Dashed lines are the backward extensions your brain supplies, and they meet at the virtual image.",
        },
        { kind: "heading", content: "The four properties, every time" },
        {
          kind: "list",
          content: [
            "The image is virtual and cannot be caught on a screen.",
            "It is erect, meaning the right way up.",
            "It is exactly the same size as the object, no matter how far away you stand.",
            "It sits as far behind the mirror as the object is in front, measured along the perpendicular.",
          ],
        },
        {
          kind: "callout",
          content:
            "Walking towards a mirror at 1 metre per second closes the gap between you and your image at 2 metres per second, because the image is walking towards you at the same speed.",
        },
        { kind: "heading", content: "Lateral inversion" },
        {
          kind: "paragraph",
          content:
            "Raise your right hand and the figure facing you raises the hand on your right hand side, which for a person facing you is their left. This is lateral inversion. Strictly the mirror has not swapped left for right at all: it has reversed front and back, and turning yourself around to face your reflection is what does the rest. The word AMBULANCE is painted reversed on the front of the vehicle so that a driver glancing in the rear view mirror reads it the right way round.",
        },
      ],
      questions: [
        {
          kind: "numeric",
          prompt:
            "A girl stands 1.4 metres in front of a plane mirror. How far is she from her own image, in metres?",
          answer: 2.8,
          tolerance: 0.05,
          unit: "metres",
          explanation:
            "The image lies 1.4 metres behind the mirror, so the distance from the girl to her image is 1.4 plus 1.4, which is 2.8 metres.",
        },
        {
          kind: "mcq",
          prompt: "Why can the image in a plane mirror never be caught on a screen?",
          explanation:
            "It is virtual. Light rays diverge after reflection and only appear to come from behind the mirror. No light actually arrives at that point, so there is nothing for a screen to catch.",
          options: [
            ["No light actually reaches the place where the image appears to be", true],
            ["The image is too dim to show up", false],
            ["The image is always much smaller than the object", false],
            ["The glass blocks the light before it reaches the screen", false],
          ],
        },
        {
          kind: "multi",
          prompt: "Select every property of an image formed by a plane mirror.",
          explanation:
            "Plane mirror images are virtual, erect, the same size as the object, and laterally inverted. They are never magnified and never inverted top to bottom.",
          options: [
            ["Virtual", true],
            ["Erect", true],
            ["The same size as the object", true],
            ["Magnified when you stand closer", false],
          ],
        },
        {
          kind: "mcq",
          prompt:
            "AMBULANCE is written reversed on the front of the vehicle. Why?",
          explanation:
            "A driver ahead sees it through a rear view mirror, which laterally inverts it. The reversed painting is inverted a second time and reads normally.",
          options: [
            ["So it reads correctly in another driver's rear view mirror", true],
            ["So it can be read from inside the ambulance", false],
            ["Because reversed letters are easier to see at speed", false],
            ["To make the word appear larger than it is", false],
          ],
        },
        {
          kind: "numeric",
          prompt:
            "A boy walks towards a plane mirror at 0.8 metres per second. At what speed does he approach his image, in metres per second?",
          answer: 1.6,
          tolerance: 0.05,
          unit: "metres per second",
          explanation:
            "His image approaches the mirror at the same 0.8 metres per second from the other side, so the gap between him and the image closes at 1.6 metres per second.",
        },
        {
          kind: "mcq",
          prompt: "Two plane mirrors face each other at 90 degrees. How many images form?",
          explanation:
            "The number of images is 360 divided by the angle, minus one. For 90 degrees that gives 4 minus 1, which is 3 images.",
          options: [
            ["3", true],
            ["2", false],
            ["4", false],
            ["Infinitely many", false],
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ 3 */
    {
      slug: "refraction",
      title: "Why the straw looks broken",
      summary:
        "Light changes speed when it enters glass or water, and changing speed means changing direction.",
      readingMinutes: 6,
      video: { title: "Tracing a ray through a glass slab", durationS: 112 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "Put a straight straw into a glass of water and it appears to snap at the surface. The straw is fine. The light coming from the submerged part is not travelling in the straight line your brain assumes it did.",
        },
        { kind: "heading", content: "Speed is the reason" },
        {
          kind: "paragraph",
          content:
            "Light travels fastest in a vacuum, slightly slower in air, noticeably slower in water and slower still in glass. When a ray crosses from one medium into another at an angle, one side of the wave front enters the new medium and slows before the other side does. That lag swings the ray around. The bending is called refraction.",
        },
        {
          kind: "figure",
          content: "refraction-slab",
          caption:
            "Fig 3.1  Entering the denser glass the ray bends towards the normal. Leaving it, the ray bends away again and emerges parallel to its original direction, shifted sideways.",
        },
        { kind: "heading", content: "Which way does it bend" },
        {
          kind: "list",
          content: [
            "Going from a rarer medium into a denser one, such as air into glass, the ray bends towards the normal.",
            "Going from a denser medium into a rarer one, such as glass into air, the ray bends away from the normal.",
            "A ray arriving exactly along the normal does not bend at all, because there is no lag across the wave front.",
          ],
        },
        {
          kind: "callout",
          content:
            "Denser here means optically denser, which is about how much the medium slows light. It is not the same as being heavier.",
        },
        { kind: "heading", content: "Refractive index" },
        {
          kind: "paragraph",
          content:
            "The refractive index of a medium is the speed of light in vacuum divided by its speed in that medium. Water is about 1.33 and ordinary glass about 1.5, which means light crawls through glass at roughly two thirds of its vacuum speed. A bigger refractive index means more slowing and more bending.",
        },
        {
          kind: "paragraph",
          content:
            "Because a glass slab has two parallel faces, the bend on the way in is undone on the way out. The emerging ray runs parallel to the ray that went in, just displaced sideways. A prism has faces that are not parallel, which is why it never undoes its own bending and can spread white light into colours.",
        },
      ],
      questions: [
        {
          kind: "mcq",
          prompt: "A ray of light passes from air into water at an angle. What happens?",
          explanation:
            "Water is optically denser than air, so light slows down and the ray bends towards the normal.",
          options: [
            ["It bends towards the normal", true],
            ["It bends away from the normal", false],
            ["It continues without bending", false],
            ["It reflects back into the air", false],
          ],
        },
        {
          kind: "numeric",
          prompt:
            "Light travels at 3.0 times 10 to the power 8 metres per second in vacuum, and at 2.0 times 10 to the power 8 metres per second in a certain medium. What is the refractive index of that medium?",
          answer: 1.5,
          tolerance: 0.02,
          unit: "no unit",
          explanation:
            "Refractive index is the speed in vacuum divided by the speed in the medium: 3.0 divided by 2.0 gives 1.5. Refractive index is a ratio, so it has no unit.",
        },
        {
          kind: "mcq",
          prompt:
            "A ray enters a rectangular glass slab and leaves through the opposite face. How does the emerging ray compare with the incident ray?",
          explanation:
            "The two faces are parallel, so the bend towards the normal on entry is reversed on exit. The emerging ray is parallel to the incident ray but shifted sideways.",
          options: [
            ["Parallel to it, but displaced sideways", true],
            ["At right angles to it", false],
            ["Bent further in the same direction", false],
            ["Along exactly the same line, with no displacement", false],
          ],
        },
        {
          kind: "multi",
          prompt: "Select every situation in which a light ray does not change direction.",
          explanation:
            "A ray along the normal has no lag across its wave front and passes straight through. A ray travelling within a single uniform medium has no boundary to cross. Crossing a boundary at an angle always bends the ray, whichever direction it is going.",
          options: [
            ["It strikes the boundary along the normal", true],
            ["It stays inside one uniform medium throughout", true],
            ["It passes from water into air at 40 degrees to the normal", false],
            ["It passes from air into glass at 25 degrees to the normal", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Why does a swimming pool look shallower than it really is?",
          explanation:
            "Light from the bottom bends away from the normal as it leaves the water. Your brain traces those rays back in straight lines, and they meet higher than the true bottom.",
          options: [
            ["Light from the bottom bends on leaving the water, so the bottom appears raised", true],
            ["Water absorbs light and hides the true depth", false],
            ["The water magnifies everything below the surface", false],
            ["Light travels faster in water, so it arrives sooner", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "A prism splits white light into colours, but a rectangular glass slab does not. Why?",
          explanation:
            "Both bend different colours by different amounts. The slab has parallel faces, so the second refraction undoes the first and the colours recombine. A prism has faces at an angle, so the separation survives.",
          options: [
            ["The slab's parallel faces undo the separation, while the prism's angled faces do not", true],
            ["Glass slabs are made of a different material from prisms", false],
            ["Only prisms are optically dense enough to bend light", false],
            ["White light does not enter a slab at all", false],
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ 4 */
    {
      slug: "convex-lens",
      title: "Where the image forms in a convex lens",
      summary:
        "Two rays are enough to find the image. Learn the two rules and you never need to measure anything.",
      readingMinutes: 7,
      video: { title: "Tracing the two easy rays", durationS: 128 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "Every ray that leaves the tip of the object and passes through the lens is bent by the same rule. Trace any two of them and the point where they cross is where the image sits. No measuring required.",
        },
        { kind: "heading", content: "The parts of the setup" },
        {
          kind: "list",
          content: [
            "The principal axis is the horizontal line through the centre of the lens.",
            "The optical centre is the middle of the lens, marked O.",
            "The focus F is the point where rays arriving parallel to the axis converge after passing through. There is one on each side.",
            "The focal length f is the distance from the optical centre to the focus.",
            "2F is simply twice the focal length from the centre, and it is the position that gives an image the same size as the object.",
          ],
        },
        { kind: "heading", content: "The two rays worth drawing" },
        {
          kind: "list",
          content: [
            "A ray leaving the object parallel to the principal axis is refracted through the focus on the far side.",
            "A ray passing through the optical centre carries straight on without bending, because the two lens faces are effectively parallel there.",
          ],
        },
        {
          kind: "figure",
          content: "convex-lens",
          caption:
            "Fig 4.1  Object at 2F. The two rays meet at 2F on the far side, giving a real, inverted image the same size as the object.",
        },
        {
          kind: "callout",
          content:
            "Where the two rays actually cross, the image is real and can be caught on a screen. Where they only appear to cross when extended backwards, the image is virtual.",
        },
        { kind: "heading", content: "The five cases" },
        {
          kind: "list",
          content: [
            "Object beyond 2F: image between F and 2F, real, inverted, smaller.",
            "Object at 2F: image at 2F on the other side, real, inverted, same size.",
            "Object between F and 2F: image beyond 2F, real, inverted, larger.",
            "Object at F: no image forms, because the rays emerge parallel and never meet.",
            "Object between F and the lens: image on the same side as the object, virtual, erect and larger. This is the magnifying glass.",
          ],
        },
        {
          kind: "paragraph",
          content:
            "Notice the pattern. As the object slides in towards the focus, the image marches outwards and grows. At the focus the image escapes to infinity, and once the object comes closer than the focus the image flips to being virtual and erect on the near side.",
        },
      ],
      questions: [
        {
          kind: "mcq",
          prompt: "The object sits exactly at 2F in front of a convex lens. What is true of the image?",
          explanation:
            "At 2F the two construction rays meet at 2F on the far side. The image is real, inverted and exactly the same size as the object.",
          options: [
            ["Same size, inverted, at 2F on the far side", true],
            ["Larger, upright, beyond 2F", false],
            ["Smaller, inverted, between F and 2F", false],
            ["No image is formed", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Which ray passes through a thin convex lens without bending?",
          explanation:
            "A ray through the optical centre meets two effectively parallel surfaces, so like a glass slab it emerges parallel to its original direction. For a thin lens the sideways shift is negligible.",
          options: [
            ["The ray through the optical centre", true],
            ["The ray parallel to the principal axis", false],
            ["The ray heading for the focus", false],
            ["Every ray bends, without exception", false],
          ],
        },
        {
          kind: "numeric",
          prompt:
            "A convex lens has a focal length of 12 centimetres. At what distance from the lens must the object be placed to get an image the same size as the object, in centimetres?",
          answer: 24,
          tolerance: 0.5,
          unit: "centimetres",
          explanation:
            "A same size image is produced only when the object is at 2F. With a focal length of 12 centimetres, 2F is 24 centimetres.",
        },
        {
          kind: "multi",
          prompt:
            "An object is placed between the focus and the lens. Select every property of the resulting image.",
          explanation:
            "Inside the focus the refracted rays diverge and only appear to meet on the object's side. The image is virtual, erect and magnified, which is exactly how a magnifying glass is used.",
          options: [
            ["Virtual", true],
            ["Erect", true],
            ["Larger than the object", true],
            ["Able to be caught on a screen", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "An object is placed exactly at the focus of a convex lens. What happens?",
          explanation:
            "The refracted rays emerge parallel to each other. Parallel rays never meet, so no image is formed at any finite distance.",
          options: [
            ["The rays emerge parallel and no image forms at a finite distance", true],
            ["A sharp image forms at the focus on the other side", false],
            ["A virtual image forms at 2F", false],
            ["The light is completely absorbed by the lens", false],
          ],
        },
        {
          kind: "numeric",
          prompt:
            "An object 4 centimetres tall produces a real image 12 centimetres tall. What is the magnification, ignoring the sign?",
          answer: 3,
          tolerance: 0.05,
          unit: "no unit",
          explanation:
            "Magnification is image height divided by object height: 12 divided by 4 gives 3. The image is three times the size of the object.",
        },
      ],
    },

    /* ------------------------------------------------------------------ 5 */
    {
      slug: "human-eye",
      title: "The lens you were born with",
      summary:
        "Your eye solves the same problem as a camera, and it solves it by changing the shape of its lens.",
      readingMinutes: 6,
      video: { title: "How the eye focuses near and far", durationS: 118 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "The eye takes light from a whole scene and lands a sharp, real, inverted image on a patch of tissue at the back. It does this continuously, adjusting as you look from this page to the far side of the room, and you never notice the adjustment happening.",
        },
        {
          kind: "figure",
          content: "human-eye",
          caption:
            "Fig 5.1  A horizontal section through the right eye. Most of the bending happens at the cornea, and the lens supplies the fine adjustment.",
        },
        { kind: "heading", content: "The parts that matter optically" },
        {
          kind: "list",
          content: [
            "The cornea is the transparent front window. It does most of the bending, because the jump from air into cornea is the biggest change in optical density in the whole path.",
            "The iris is the coloured ring, and it is a muscle. It controls the size of the pupil.",
            "The pupil is the black opening in the middle. It looks black because almost no light that enters comes back out.",
            "The lens is flexible and provides the adjustment rather than the bulk of the bending.",
            "The ciliary muscles squeeze or relax the lens to change its focal length.",
            "The retina is the light sensitive layer at the back, carrying rods for dim light and cones for colour and detail.",
            "The optic nerve carries the signal to the brain. Where it leaves there are no receptors at all, which is the blind spot.",
          ],
        },
        { kind: "heading", content: "Accommodation" },
        {
          kind: "paragraph",
          content:
            "A camera focuses by moving its lens back and forth. Your eye cannot do that, because the distance from lens to retina is fixed. Instead the ciliary muscles change the shape of the lens. To see something near, they contract and the lens becomes fatter, which shortens the focal length. To see something far, they relax and the lens flattens. This shape changing is called accommodation, and holding a book too close for too long is tiring precisely because it keeps those muscles contracted.",
        },
        {
          kind: "callout",
          content:
            "The image on your retina is real and upside down. The brain has always received it that way and interprets it as the right way up.",
        },
        { kind: "heading", content: "When it needs help" },
        {
          kind: "list",
          content: [
            "Myopia, or short sightedness: distant objects focus in front of the retina, usually because the eyeball is slightly too long. A concave lens spreads the light a little first, pushing the focus back onto the retina.",
            "Hypermetropia, or long sightedness: near objects would focus behind the retina. A convex lens converges the light a little first, pulling the focus forward.",
            "Presbyopia: with age the lens stiffens and accommodation weakens, which is why reading glasses become common later in life.",
          ],
        },
      ],
      questions: [
        {
          kind: "mcq",
          prompt: "Which part of the eye does most of the bending of incoming light?",
          explanation:
            "The cornea. The change in optical density from air to cornea is the largest anywhere along the path, so it does the bulk of the work. The lens supplies fine adjustment.",
          options: [
            ["The cornea", true],
            ["The lens", false],
            ["The retina", false],
            ["The iris", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "How does the eye focus on a nearby object?",
          explanation:
            "The ciliary muscles contract, the lens becomes fatter and its focal length shortens. The lens itself does not move.",
          options: [
            ["The ciliary muscles contract and the lens becomes fatter", true],
            ["The lens moves closer to the retina", false],
            ["The pupil closes completely", false],
            ["The retina moves backwards", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Which lens corrects myopia?",
          explanation:
            "In myopia the image forms in front of the retina. A concave lens diverges the light before it enters the eye, moving the focus back onto the retina.",
          options: [
            ["A concave lens", true],
            ["A convex lens", false],
            ["A plane glass sheet", false],
            ["A prism", false],
          ],
        },
        {
          kind: "multi",
          prompt: "Select every true statement about the image formed on the retina.",
          explanation:
            "The retinal image is real, because light genuinely converges there, and it is inverted. It is also much smaller than the object. The brain interprets it as upright.",
          options: [
            ["It is real", true],
            ["It is inverted", true],
            ["It is smaller than the object", true],
            ["It is virtual", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Why does the pupil appear black?",
          explanation:
            "The pupil is a hole. Light that enters is almost entirely absorbed inside the eye, so hardly any comes back out towards you.",
          options: [
            ["It is an opening, and light entering it is absorbed rather than reflected back", true],
            ["It is filled with a black pigment", false],
            ["The lens behind it blocks all light", false],
            ["It is a dark coloured muscle", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "What causes the blind spot?",
          explanation:
            "The optic nerve leaves the eye at one point on the retina. There are no rods or cones there, so light landing on that spot produces no signal.",
          options: [
            ["There are no light sensitive cells where the optic nerve leaves the retina", true],
            ["The lens cannot focus on that part of the retina", false],
            ["The iris casts a shadow on that region", false],
            ["Blood vessels block the light at that point", false],
          ],
        },
      ],
    },
  ],
};
