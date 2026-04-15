const path = require('path');

const IMAGE_SOURCE = {
  sourceName: 'VerifEye curated local image pool',
  sourceUrl: '',
  license: 'Local project assets'
};

const AUDIO_SOURCE = {
  sourceName: 'UniDataPro/real-vs-fake-human-voice-deepfake-audio',
  sourceUrl: 'https://huggingface.co/datasets/UniDataPro/real-vs-fake-human-voice-deepfake-audio',
  license: 'CC-BY-NC-ND-4.0'
};

const VIDEO_SOURCE = {
  sourceName: 'UniDataPro/deepfake-videos-dataset',
  sourceUrl: 'https://huggingface.co/datasets/UniDataPro/deepfake-videos-dataset',
  license: 'CC-BY-NC-ND-4.0'
};

const aiImageDefinitions = [
  {
    file: 'ai_1.jpg',
    hotspots: [
      { x: 50, y: 58, text: 'The roofline and support structure blend together in an unnatural way.' },
      { x: 66, y: 71, text: 'Chair and table shapes lose clean physical edges.' }
    ],
    explanation: 'AI-generated image. The scene looks believable at first, but the shelter structure and furniture lose realistic geometry when you inspect them.'
  },
  {
    file: 'ai_2.jpg',
    hotspots: [
      { x: 50, y: 56, text: 'The awning and storefront details smear together instead of resolving cleanly.' },
      { x: 56, y: 47, text: 'Interior signage and object boundaries become muddy and inconsistent.' }
    ],
    explanation: 'AI-generated image. Look at the awning, signage, and small architectural details. They soften into synthetic-looking shapes instead of staying crisp.'
  },
  {
    file: 'ai_3.jpg',
    hotspots: [
      { x: 19, y: 77, text: 'Desk objects and cables merge into each other unnaturally.' },
      { x: 77, y: 64, text: 'The seated figure and nearby edges lose realistic separation.' }
    ],
    explanation: 'AI-generated image. The lighting is cinematic, but small objects and the human silhouette break down under closer inspection.'
  },
  {
    file: 'ai_4.jpg',
    hotspots: [
      { x: 13, y: 35, text: 'The menu text is malformed instead of readable.' },
      { x: 85, y: 34, text: 'The sign lettering warps like generated pseudo-text.' }
    ],
    explanation: 'AI-generated image. The architecture is strong, but the text elements give it away because they are shaped like writing without actually being coherent.'
  },
  {
    file: 'ai_5.jpg',
    hotspots: [
      { x: 51, y: 60, text: 'Roof slats and lit interior objects melt into each other.' },
      { x: 40, y: 72, text: 'The chair and table contours are too soft and inconsistent.' }
    ],
    explanation: 'AI-generated image. The night mood works, but the roof texture and furniture shapes do not stay physically consistent.'
  },
  {
    file: 'ai_6.jpg',
    hotspots: [
      { x: 50, y: 55, text: 'Facade ornaments and window details do not resolve symmetrically.' },
      { x: 70, y: 60, text: 'The side structures look plausible overall, but the details are uneven and synthetic.' }
    ],
    explanation: 'AI-generated image. The cathedral scene is convincing, but the central facade and repeated architectural details are slightly inconsistent.'
  },
  {
    file: 'ai_7.jpg',
    hotspots: [
      { x: 53, y: 57, text: 'Door and window geometry do not align as cleanly as a real structure would.' },
      { x: 35, y: 52, text: 'The wall textures and edge transitions look over-smoothed.' }
    ],
    explanation: 'AI-generated image. The aurora distracts from it, but the building geometry and texture transitions reveal synthetic construction.'
  },
  {
    file: 'ai_8.jpg',
    hotspots: [
      { x: 51, y: 61, text: 'The annex and roof intersections lose precise structure.' },
      { x: 33, y: 78, text: 'The curving road edges and shadows feel algorithmically smoothed.' }
    ],
    explanation: 'AI-generated image. The aerial view is polished, but the building joins and road edges do not hold up like a real photo.'
  },
  {
    file: 'ai_9.jpg',
    hotspots: [
      { x: 51, y: 55, text: 'The roof ridge and facade proportions feel too perfect and slightly distorted at once.' },
      { x: 23, y: 72, text: 'The crowd texture repeats into a synthetic-looking pattern instead of distinct people.' }
    ],
    explanation: 'AI-generated image. The huge crowd and ornate building look plausible overall, but repeated crowd texture and odd proportions reveal the generation.'
  },
  {
    file: 'ai_10.jpg',
    hotspots: [
      { x: 50, y: 42, text: 'The aurora folds into unusually smooth, mirrored shapes.' },
      { x: 18, y: 72, text: 'Fence posts and snow edges simplify into generated-looking geometry.' }
    ],
    explanation: 'AI-generated image. The scene is striking, but the aurora shape logic and the fence details are more synthetic than photographic.'
  }
];

const realImageDefinitions = Array.from({ length: 10 }, (_, index) => ({
  file: `real_${index + 1}.jpg`,
  explanation: [
    'Real image. Structural detail, texture, and lighting remain coherent across the scene.',
    'Real image. Fine details stay grounded instead of collapsing into generated patterns.',
    'Real image. Materials, perspective, and small scene details behave naturally.',
    'Real image. The edges, textures, and depth cues stay physically consistent.',
    'Real image. Complex details are preserved without the melted look common in generated content.'
  ][index % 5]
}));

const imagePool = [
  ...aiImageDefinitions.map((item, index) => ({
    id: `image-ai-${index + 1}`,
    mediaType: 'image',
    src: `/assets/images/dataset/${item.file}`,
    isAI: true,
    hotspots: item.hotspots,
    explanation: item.explanation,
    ...IMAGE_SOURCE
  })),
  ...realImageDefinitions.map((item, index) => ({
    id: `image-real-${index + 1}`,
    mediaType: 'image',
    src: `/assets/images/dataset/${item.file}`,
    isAI: false,
    hotspots: [],
    explanation: item.explanation,
    ...IMAGE_SOURCE
  }))
];

const audioPool = [
  ...Array.from({ length: 5 }, (_, index) => ({
    id: `audio-real-${index + 1}`,
    mediaType: 'audio',
    src: `/assets/audio/self-assessment/real-audio-${index + 1}.mp3`,
    isAI: false,
    explanation: [
      'Real human voice sample. Breathing, cadence shifts, and micro-pauses sound naturally irregular.',
      'Real human voice sample. The delivery includes subtle timing variation that synthetic speech often smooths over.',
      'Real human voice sample. The rhythm and transitions between phrases stay naturally uneven.'
    ][index % 3],
    ...AUDIO_SOURCE
  })),
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `audio-ai-${index + 1}`,
    mediaType: 'audio',
    src: `/assets/audio/self-assessment/ai-audio-${index + 1}.mp3`,
    isAI: true,
    explanation: [
      'AI-generated voice sample. The phrasing is fluent, but the cadence and timbre stay unusually even.',
      'AI-generated voice sample. Transitions between phrases feel machine-smoothed compared with natural speech.',
      'AI-generated voice sample. Prosody is strong, but the emotional contour still sounds machine-shaped.'
    ][index % 3],
    ...AUDIO_SOURCE
  }))
];

const realVideoClips = [
  { file: 'real-video-1.mp4', start: 0, end: 4.2 },
  { file: 'real-video-1.mp4', start: 4.4, end: 8.7 },
  { file: 'real-video-2.mp4', start: 0, end: 3.2 },
  { file: 'real-video-2.mp4', start: 3.4, end: 6.6 },
  { file: 'real-video-2.mp4', start: 6.8, end: 9.7 },
  { file: 'real-video-3.mp4', start: 0, end: 3.1 },
  { file: 'real-video-3.mp4', start: 3.3, end: 6.1 },
  { file: 'real-video-3.mp4', start: 6.3, end: 8.8 },
  { file: 'real-video-4.mp4', start: 0, end: 3.4 },
  { file: 'real-video-4.mp4', start: 3.6, end: 7.5 }
];

const aiVideoClips = [
  { file: 'ai-video-1.mp4', start: 0, end: 9.4 },
  { file: 'ai-video-2.mp4', start: 0, end: 8.5 },
  { file: 'ai-video-3.mp4', start: 0, end: 3.8 },
  { file: 'ai-video-4.mp4', start: 0, end: 7.6 },
  { file: 'ai-video-5.mov', start: 0, end: 9.4 }
];

const videoPool = [
  ...realVideoClips.map((clip, index) => ({
    id: `video-real-${index + 1}`,
    mediaType: 'video',
    src: `/assets/video/self-assessment/${clip.file}`,
    clipStart: clip.start,
    clipEnd: clip.end,
    isAI: false,
    explanation: [
      'Real video. Motion, lighting, and facial alignment remain stable from frame to frame.',
      'Real video. The subject and background preserve natural temporal consistency without face-swap warping.',
      'Real video. Frame-to-frame details remain coherent instead of flickering.'
    ][index % 3],
    ...VIDEO_SOURCE
  })),
  ...aiVideoClips.map((clip, index) => ({
    id: `video-ai-${index + 1}`,
    mediaType: 'video',
    src: `/assets/video/self-assessment/${clip.file}`,
    clipStart: clip.start,
    clipEnd: clip.end,
    isAI: true,
    explanation: [
      'AI/deepfake video. Watch for facial boundary shimmer, identity blending, or slight motion inconsistencies.',
      'AI/deepfake video. The clip is plausible overall, but small temporal artifacts can reveal the manipulation.',
      'AI/deepfake video. Facial texture and movement can drift slightly apart as the clip plays.'
    ][index % 3],
    ...VIDEO_SOURCE
  }))
];

function shuffleArray(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function takeRandomItems(items, count) {
  return shuffleArray(items).slice(0, count);
}

function excludeItems(pool, excludedIds) {
  const available = pool.filter((item) => !excludedIds.has(item.id));
  return available.length ? available : pool;
}

function selectItems(pool, count, excludedIds) {
  const available = excludeItems(pool, excludedIds);
  if (available.length >= count) {
    return takeRandomItems(available, count);
  }

  return takeRandomItems(pool, count);
}

function withMetadata(item) {
  return {
    ...item,
    assetName: path.basename(item.src)
  };
}

function buildSelfAssessmentQuiz(excludedIds = []) {
  const excludedSet = new Set(excludedIds);
  const selectedItems = [
    ...selectItems(imagePool.filter((item) => !item.isAI), 2, excludedSet),
    ...selectItems(imagePool.filter((item) => item.isAI), 2, excludedSet),
    ...selectItems(audioPool.filter((item) => !item.isAI), 1, excludedSet),
    ...selectItems(audioPool.filter((item) => item.isAI), 2, excludedSet),
    ...selectItems(videoPool.filter((item) => !item.isAI), 2, excludedSet),
    ...selectItems(videoPool.filter((item) => item.isAI), 1, excludedSet)
  ];

  return shuffleArray(selectedItems).map((question, index) => ({
    ...withMetadata(question),
    roundNumber: index + 1
  }));
}

module.exports = {
  buildSelfAssessmentQuiz
};
