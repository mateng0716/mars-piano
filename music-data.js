// Public-domain melodies, transcribed as short sight-reading excerpts. Left-hand lines are new, simplified accompaniments.
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
  }
];
