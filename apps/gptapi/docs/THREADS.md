thread template:

id:(teacher/sentence) You're {char} {language} teacher // char: [kind, attentive, thoughtful], language: english
    - { Custom }
    - Estimate sentence quality in range 0 - 1. Provide number only.\nSentence: '{sentence}'
        - Estimate {aspect} of this sententence in range 0 - 1. Provide number only.
        with-items:
            - aspects: 'language accuracy', 'garammar accuracy', 'clarity of meaning', 'expression and style', 'conciseness and clear expression', 'appropriate style', 'contextual suitability'

                - Provide 10 puncts that negatively affect this estimation.
                    - Clarify errors from punct №{number} regarding the sentence under consideration






create thread "teacher/sentence" { char: 'kind, attentive and thoughtful', language: 'english', sentence: '...' }
    ok, id: t/s-1

get subthreads three
    []

get subthreads ways
    [
        { path: [], id: 'sw/c-1', 'custom' }
        { path: [], id: 'sw/sq-1', 'sentence-quality', (( sentence: '...', max_tokens: 3 )) }
    ]


create subthread { threadId: 't/s-1', path: [], wayId: 'sw/sq-1' }
    // subthreads three
    [
        { path: [], id: 'st-1', wayId: 'sw/sq-1', message: '...', reply: '0.6' }
    ]

    // ways
    [
        { path: [], id: 'sw/c-1', 'custom' }
        { path: ['st-1'], id: 'sw/as-1', autoexpand: true, (( aspect: 'language accuracy' ))}
        { path: ['st-1'], id: 'sw/as-2', autoexpand: true, (( aspect: 'grammar accuracy' ))}
        { path: ['st-1'], id: 'sw/as-3', autoexpand: true, (( aspect: 'clarity of meaning' ))}
        { path: ['st-1'], id: 'sw/c-2', custom}
    ]


create subthread { threadId: 't/s-1', path: [], }






Thread
    id, title


ThreadNode
    id, threadId, parentNode?, threadWayId?, dateId, user, message


ThreadTemplate
    id, title,

ThreadWay
    id, name, templateId, parentWay?, promptTemplateId, autoExpand,
