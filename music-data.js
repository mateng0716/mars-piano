// Short sight-reading excerpts. Modern-song entries are children's teaching adaptations, not official scores.
// Left-hand lines are new, simplified accompaniments. All five are adapted into C major for beginner reading.
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
    title:'小步舞曲',composer:'C. 佩措尔德',grade:'2 级目标',meter:'3/4',key:'C 大调 · 移调',
    description:'原曲是 G 大调；这里移到 C 大调，按三拍读开头，左手是简化伴奏。',
    source:'https://imslp.org/wiki/Minuet_(Pezold%2C_Christian)',
    hands:{
      right:[
        [note('G4'),note('C4',.5),note('D4',.5),note('E4',.5),note('F4',.5)],
        [note('G4'),note('C4'),note('C4')],
        [note('A4'),note('F4',.5),note('G4',.5),note('A4',.5),note('B4',.5)],
        [note('C5'),note('C4'),note('C4')]
      ],
      left:[
        [note('C3'),note('G3'),note('C3')],
        [note('E3'),note('G3'),note('C3')],
        [note('F3'),note('C3'),note('F3')],
        [note('C3'),note('G3'),note('C3')]
      ]
    }
  },
  {
    title:'致爱丽丝',composer:'贝多芬',grade:'3 级目标',meter:'3/8',key:'C 大调 · 教学改编',
    description:'移到 C 大调练习音区，保留开头 F♯–G 的半音动机，按每小节三个八分音符练习。',
    source:'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=931',
    hands:{
      right:[
        [note('G5',.5),note('F#5',.5),note('G5',.5)],
        [note('F#5',.5),note('G5',.5),note('D5',.5)],
        [note('F5',.5),note('E5',.5),note('C5',.5)],
        [note('E4',.5),note('G4',.5),note('C5',.5)]
      ],
      left:[
        [note('C3',.5),note('G3',.5),note('C3',.5)],
        [note('G3',.5),note('C3',.5),note('G3',.5)],
        [note('C3',.5),note('G3',.5),note('C3',.5)],
        [note('E3',.5),note('G3',.5),note('C3',.5)]
      ]
    }
  },
  {
    title:'大梦归',composer:'陈曦 · 周深演唱',grade:'2 级目标',meter:'4/4',key:'C 大调 · 教学改编',modern:true,
    description:'把副歌短句改为 C 大调白键版，按四拍完整读一小节；左手用两个长音托住。',
    source:'https://www.youtube.com/watch?v=Xb8AQoiofOY',
    hands:{
      right:[
        [note('C5',.5),note('G5',.5),note('G5'),note('D5',.5),note('G5',.5),note('G5')],
        [note('E5',.5),note('E5',.5),note('F5'),note('G5'),note('F5')],
        [note('F5',.5),note('F5',.5),note('A5'),note('E5',.5),note('E5',.5),note('G5')],
        [note('F5',.5),note('F5',.5),note('G5'),note('F5',.5),note('E5',.5),note('D5')]
      ],
      left:[
        [note('C3',2),note('G3',2)],
        [note('A3',2),note('E3',2)],
        [note('F3',2),note('C3',2)],
        [note('G3',2),note('D4',2)]
      ]
    }
  },
  {
    title:'吉量',composer:'谭淇尹 · 周深演唱',grade:'2 级目标',meter:'4/4',key:'C 大调 · 教学改编',modern:true,
    description:'把开场反复出现的主题改为 C 大调白键版，跟着四拍练跳进、重复音和左手长音。',
    source:'https://www.youtube.com/watch?v=C7j-HocIXLE',
    hands:{
      right:[
        [note('B4',.5),note('C5',.5),note('C5',.5),note('G4',.5),note('B4',.5),note('C5',.5),note('C5')],
        [note('E5'),note('C5'),note('E5'),note('C5')],
        [note('B4',.5),note('C5',.5),note('C5',.5),note('G4',.5),note('F4',.5),note('G4',.5),note('E4',.5),note('C4',.5)],
        [note('E4'),note('C4'),note('E4'),note('C4')]
      ],
      left:[
        [note('C3',2),note('G3',2)],
        [note('C3',2),note('G3',2)],
        [note('A3',2),note('E3',2)],
        [note('C3',2),note('G3',2)]
      ]
    }
  }
];
