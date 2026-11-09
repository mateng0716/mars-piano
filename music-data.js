// Short sight-reading excerpts. Modern-song entries are children's teaching adaptations, not official scores.
// Left-hand lines are new, simplified accompaniments. 吉量's opening motif is transposed from B-flat minor to A minor.
// Levels describe reading goals inspired by ABRSM Practical Piano sight-reading, not official exam-piece status.
const note=(pitch,beats=1)=>({pitch,beats});
const MUSIC_PIECES=[
  {
    title:'欢乐颂',composer:'贝多芬',grade:'1 级目标',meter:'4/4',key:'C 大调',
    description:'先认相邻的音，再读四拍小节。右手读原曲开头旋律，左手读简化伴奏。',
    source:'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=528',
    hands:{
      right:[
        [note('E4'),note('E4'),note('F4'),note('G4')],
        [note('G4'),note('F4'),note('E4'),note('D4')],
        [note('C4'),note('C4'),note('D4'),note('E4')],
        [note('E4'),note('D4'),note('D4',2)]
      ],
      left:[
        [note('C3'),note('E3'),note('G3'),note('E3')],
        [note('G3'),note('D3'),note('G3'),note('D3')],
        [note('F3'),note('C3'),note('F3'),note('C3')],
        [note('G3'),note('D3'),note('G3'),note('C3')]
      ]
    }
  },
  {
    title:'G 大调小步舞曲',composer:'C. 佩措尔德',grade:'2 级目标',meter:'3/4',key:'G 大调',
    description:'认识 G 大调的 F♯，按三拍读小步舞曲开头。左手是简化伴奏。',
    source:'https://imslp.org/wiki/Minuet_(Pezold%2C_Christian)',
    hands:{
      right:[
        [note('D5'),note('G4',.5),note('A4',.5),note('B4',.5),note('C5',.5)],
        [note('D5'),note('G4'),note('G4')],
        [note('E5'),note('C5',.5),note('D5',.5),note('E5',.5),note('F#5',.5)],
        [note('G5'),note('G4'),note('G4')]
      ],
      left:[
        [note('G3'),note('D4'),note('G3')],
        [note('B3'),note('D4'),note('G3')],
        [note('C4'),note('G3'),note('C4')],
        [note('G3'),note('D4'),note('G3')]
      ]
    }
  },
  {
    title:'致爱丽丝',composer:'贝多芬',grade:'3 级目标',meter:'3/8',key:'A 小调',
    description:'读高音区与 D♯ 半音。右手取原曲开头片段，左手是简化伴奏。',
    source:'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=931',
    hands:{
      right:[
        [note('E5',.5),note('D#5',.5),note('E5',.5)],
        [note('D#5',.5),note('E5',.5),note('B4',.5)],
        [note('D5',.5),note('C5',.5),note('A4',.5)],
        [note('C4',.5),note('E4',.5),note('A4',.5)]
      ],
      left:[
        [note('A3',.5),note('E4',.5),note('A3',.5)],
        [note('E4',.5),note('A3',.5),note('E4',.5)],
        [note('A3',.5),note('E4',.5),note('A3',.5)],
        [note('C4',.5),note('E4',.5),note('A3',.5)]
      ]
    }
  },
  {
    title:'大梦归',composer:'陈曦 · 周深演唱',grade:'2 级目标',meter:'4/4',key:'A 小调',modern:true,
    description:'从熟悉的副歌动机开始，每小节只读一小句。右手保留主旋律走向，左手用两个长音轻轻托住。',
    source:'https://www.youtube.com/watch?v=Xb8AQoiofOY',
    hands:{
      right:[
        [note('A4',.5),note('E5',.5),note('E5'),note('B4',.5),note('E5',.5),note('E5')],
        [note('C5',.5),note('C5',.5),note('D5'),note('E5'),note('D5')],
        [note('D5',.5),note('D5',.5),note('F5'),note('C5',.5),note('C5',.5),note('E5')],
        [note('D5',.5),note('D5',.5),note('E5'),note('D5',.5),note('C5',.5),note('B4')]
      ],
      left:[
        [note('A3',2),note('E3',2)],
        [note('F3',2),note('C3',2)],
        [note('D3',2),note('A3',2)],
        [note('E3',2),note('B3',2)]
      ]
    }
  },
  {
    title:'吉量',composer:'谭淇尹 · 周深演唱',grade:'2 级目标',meter:'4/4',key:'A 小调 · 移调',modern:true,
    description:'把开场反复出现的主题移到好找的白键音区。先读右手的跳进与重复音，再读左手的两个长音。',
    source:'https://www.youtube.com/watch?v=C7j-HocIXLE',
    hands:{
      right:[
        [note('G4',.5),note('A4',.5),note('A4',.5),note('E4',.5),note('G4',.5),note('A4',.5),note('A4')],
        [note('C5'),note('A4'),note('C5'),note('A4')],
        [note('G4',.5),note('A4',.5),note('A4',.5),note('E4',.5),note('D4',.5),note('E4',.5),note('C4',.5),note('A3',.5)],
        [note('C4'),note('A3'),note('C4'),note('A3')]
      ],
      left:[
        [note('A3',2),note('E3',2)],
        [note('A3',2),note('E3',2)],
        [note('F3',2),note('C3',2)],
        [note('A3',2),note('E3',2)]
      ]
    }
  }
];
