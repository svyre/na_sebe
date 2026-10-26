import type { PropKind } from '@/lib/story-scenes';
import { memo } from 'react';
import { bankLogo } from './bank-brand';
function Laptop({ used = false }: { used?: boolean }) {
  return (
    <g>
      <path
        d="M27 28q0-6 6-6h108q6 0 6 6v70H27Z"
        fill={used ? '#7f9e9c' : '#627fbc'}
        stroke="#344652"
        strokeWidth="3"
      />
      <path d="M35 31h104v58H35Z" fill={used ? '#c4d6ca' : '#d4e6ed'} />
      <path
        d="m19 98-10 15q-2 5 6 5h145q8 0 5-5l-17-15Z"
        fill="#c9d3d3"
        stroke="#344652"
        strokeWidth="3"
      />
      <path d="M65 104h44" stroke="#a0aeb3" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M48 49h40M48 59h65M48 69h33"
        stroke="#7996b6"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {used && <path d="m112 74 5 5 11-13" fill="none" stroke="#4c866f" strokeWidth="4" />}
    </g>
  );
}

function Phone({ cracked = false }: { cracked?: boolean }) {
  return (
    <g>
      <rect x="57" y="8" width="66" height="113" rx="12" fill="#344652" />
      <rect x="63" y="15" width="54" height="98" rx="7" fill="#b9cfdf" />
      <rect x="78" y="15" width="23" height="6" rx="3" fill="#344652" />
      {cracked ? (
        <path
          d="m75 32 18 26-15 17 27 22M93 58l16-11M78 75l-10 9"
          fill="none"
          stroke="#f9fcfd"
          strokeWidth="3"
        />
      ) : (
        <>
          <rect x="73" y="42" width="34" height="25" rx="5" fill="#fff" />
          <path d="m79 54 6 6 15-15" stroke="#56799c" strokeWidth="3" fill="none" />
          <circle cx="89" cy="88" r="5" fill="#f4cd92" />
        </>
      )}
    </g>
  );
}

export const StoryObject = memo(function StoryObject({ kind }: { kind: PropKind }) {
  const line = {
    stroke: '#344652',
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <svg viewBox="0 0 180 130" aria-hidden="true" className={`story-object object-${kind}`}>
      <ellipse cx="90" cy="120" rx="65" ry="7" fill="#344652" opacity=".10" />
      {kind === 'car' || kind === 'bus' ? (
        <>
          <path
            d={
              kind === 'bus'
                ? 'M23 38q0-12 12-12h109q12 0 12 12v63H23Z'
                : 'M22 78l19-37h72l30 37 17 6v24H20V85Z'
            }
            fill={kind === 'bus' ? '#8caca8' : '#e6c88c'}
            {...line}
          />
          <path
            d={kind === 'bus' ? 'M35 38h106v35H35Z' : 'm49 49-13 27h92l-22-27Z'}
            fill="#dcebef"
            {...line}
          />
          <path d="M86 39v37" {...line} />
          <circle cx="47" cy="108" r="15" fill="#405361" />
          <circle cx="130" cy="108" r="15" fill="#405361" />
          <circle cx="47" cy="108" r="7" fill="#b7c4c4" />
          <circle cx="130" cy="108" r="7" fill="#b7c4c4" />
        </>
      ) : kind === 'bike' ? (
        <>
          <circle cx="42" cy="91" r="28" fill="#e5ede5" {...line} />
          <circle cx="138" cy="91" r="28" fill="#e5ede5" {...line} />
          <path
            d="m42 91 30-43 28 43H42l36-36h43l17 36-27-63h17M67 44h21"
            fill="none"
            stroke="#537d9a"
            strokeWidth="6"
          />
          <path d="m99 91 11 10m-1-73-2-9" {...line} />
        </>
      ) : kind === 'medicine' ? (
        <>
          <rect x="29" y="38" width="123" height="78" rx="10" fill="#e8e7d8" {...line} />
          <path d="M70 38V23h42v15" fill="none" {...line} />
          <path d="M81 52h20v16h17v20h-17v17H81V88H64V68h17Z" fill="#b97b6a" />
        </>
      ) : kind === 'food' ? (
        <>
          <ellipse cx="89" cy="92" rx="66" ry="26" fill="#e6e9d7" {...line} />
          <ellipse cx="89" cy="89" rx="49" ry="16" fill="#b3c6aa" />
          <path d="m64 85 13-26 28 26Z" fill="#d6ad70" stroke="#816c4a" strokeWidth="2" />
          <circle cx="104" cy="75" r="12" fill="#cf9273" />
          <path d="M28 34v30m10-30v30m-5-2v44m124-70v73" fill="none" {...line} />
          <path d="M127 22h25v30h-25Z" fill="#e9cdb0" {...line} />
        </>
      ) : kind === 'wifi' ? (
        <>
          <rect x="24" y="82" width="132" height="33" rx="8" fill="#a9c1c3" {...line} />
          <path
            d="M44 82V63m92 19V63M42 37q48-38 96 0M59 53q31-25 62 0M77 67q13-12 26 0"
            fill="none"
            stroke="#718fa8"
            strokeWidth="7"
          />
          <circle cx="90" cy="79" r="5" fill="#718fa8" />
          <circle cx="137" cy="99" r="3" fill="#eaf2e8" />
        </>
      ) : kind === 'shoe' ? (
        <>
          <path d="m39 44 37 7 12 28 46 15q20 3 24 20H22l1-45Z" fill="#a4b6cc" {...line} />
          <path d="M23 106h133v13H23Z" fill="#f1edda" {...line} />
          <path
            d="m71 74 23-7m-16 17 25-7m-18 17 25-7"
            stroke="#f8f5e5"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : kind === 'laptop' || kind === 'usedLaptop' ? (
        <Laptop used={kind === 'usedLaptop'} />
      ) : kind === 'phone' ? (
        <Phone />
      ) : kind === 'code' || kind === 'message' || kind === 'close' ? (
        <>
          <Phone cracked={false} />
          <path
            d="M19 30h68v42H38L19 86Z"
            fill={kind === 'code' ? '#efc5ad' : '#eff4e7'}
            {...line}
          />
          {kind === 'close' ? (
            <path d="m40 44 21 15m0-15L40 59" {...line} />
          ) : (
            <>
              <path d="M31 43h43M31 54h25" {...line} />
              <circle cx="49" cy="65" r="2" fill="#344652" />
            </>
          )}
        </>
      ) : kind === 'tools' ? (
        <>
          <Laptop used />
          <path
            d="m99 106 35-55q-9-26 15-26l-3 18 13 6 12-13q8 22-17 27l-36 57Z"
            fill="#ebc584"
            {...line}
          />
          <path d="m26 31 11-7 58 75-13 10Z" fill="#d58f74" {...line} />
        </>
      ) : kind === 'gift' || kind === 'craft' ? (
        <>
          <rect
            x="32"
            y="49"
            width="112"
            height="69"
            rx="5"
            fill={kind === 'craft' ? '#a0beb0' : '#dc9b84'}
            {...line}
          />
          <path d="M27 43h122v23H27Z" fill="#f0d391" {...line} />
          <path d="M80 44h16v74H80Z" fill="#fff0bd" stroke="#344652" strokeWidth="2" />
          <path d="M85 43C29 31 46 1 70 17l18 24c18-52 60-24 21-8Z" fill="#d9b875" {...line} />
          {kind === 'craft' && <path d="m130 92 27-44 10 7-27 44-12 7Z" fill="#647ba9" {...line} />}
        </>
      ) : kind === 'books' || kind === 'course' || kind === 'exam' ? (
        <>
          <path d="M27 89h118v26H27Z" fill="#8cae9a" {...line} />
          <path d="M38 64h118v26H38Z" fill="#e7bd8e" {...line} />
          <path d="M27 38h118v26H27Z" fill="#899ec6" {...line} />
          <path d="M48 44v15M59 70v15M48 95v15" stroke="#f8f3df" strokeWidth="4" />
          {kind !== 'books' && (
            <>
              <path d="m83 12 50 13-45 20-43-16Z" fill="#344652" />
              <path d="m59 33 1 15q26 17 54-5V33" fill="#55729b" />
              <path d="m129 29 2 24" stroke="#e4c178" strokeWidth="4" />
            </>
          )}
        </>
      ) : kind === 'calendar' || kind === 'list' || kind === 'receipt' ? (
        <>
          <rect x="39" y="16" width="102" height="102" rx="7" fill="#faf5e4" {...line} />
          <path
            d="M39 16h102v25H39Z"
            fill={kind === 'calendar' ? '#d59178' : '#a9bfc5'}
            {...line}
          />
          <path d="M62 10v17M116 10v17" {...line} />
          {kind === 'calendar' ? (
            <>
              {[60, 87, 114].map((x) =>
                [56, 79, 102].map((y) => (
                  <rect
                    key={x + ':' + y}
                    x={x - 6}
                    y={y - 5}
                    width="13"
                    height="10"
                    rx="2"
                    fill={y === 56 ? '#d59178' : '#c5d0ce'}
                  />
                )),
              )}
            </>
          ) : (
            <>
              {[55, 76, 97].map((y) => (
                <g key={y}>
                  <path d={`m51 ${y} 5 5 7-9`} fill="none" stroke="#638e7c" strokeWidth="3" />
                  <path d={`M73 ${y}h49`} {...line} />
                </g>
              ))}
            </>
          )}
        </>
      ) : kind === 'app' ? (
        <>
          <Phone />
          <rect x="67" y="30" width="46" height="19" rx="3" fill="#fff" />
          <image href={bankLogo} x="69" y="34" width="42" height="11" />
          <path
            d="m80 80 8 8 15-18"
            fill="none"
            stroke="#4d816d"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : kind === 'bank' || kind === 'coins' ? (
        <>
          <rect x="27" y="32" width="127" height="79" rx="12" fill="#3e60c3" {...line} />
          <path d="M109 33 57 111h28l58-78" fill="#e6bc70" />
          <rect x="41" y="53" width="23" height="17" rx="4" fill="#d9d0a8" />
          {[105, 119, 133].map((x, i) => (
            <circle key={x} cx={x} cy={105 - i * 5} r="16" fill="#e4c889" {...line} />
          ))}
        </>
      ) : kind === 'washer' ? (
        <>
          <rect x="42" y="12" width="96" height="110" rx="8" fill="#e8eadd" {...line} />
          <path d="M43 37h94" {...line} />
          <circle cx="90" cy="78" r="31" fill="#92afb8" {...line} />
          <circle cx="90" cy="78" r="22" fill="#b5d2cf" />
          <circle cx="121" cy="25" r="4" fill="#647d93" />
          <path d="m69 63 11 12-8 12 21 10" stroke="#ecf5f2" strokeWidth="3" fill="none" />
        </>
      ) : kind === 'campus' ? (
        <>
          <path d="M25 55 89 17l64 38Z" fill="#e0b894" {...line} />
          <path d="M35 55h107v60H35Z" fill="#e4e7d8" {...line} />
          {[52, 82, 112].map((x) => (
            <path key={x} d={`M${x} 57v54`} stroke="#859fa8" strokeWidth="13" />
          ))}
          <path d="M22 119h135" {...line} />
        </>
      ) : kind === 'rest' ? (
        <>
          <path d="m32 96 30-39 82 21-30 39Z" fill="#a4bbb0" {...line} />
          <path d="m51 82 27-16 37 9-26 17Z" fill="#eee6cf" {...line} />
          <path d="M63 19v36m0-36 26 6M40 33l23-14" {...line} />
          <path d="m121 72 12-23q10-18 20-1l-2 35" fill="#d5ac84" {...line} />
        </>
      ) : kind === 'travel' ? (
        <>
          <rect x="43" y="39" width="95" height="76" rx="13" fill="#d9b487" {...line} />
          <path d="M72 38V23h37v15" fill="none" {...line} />
          <path d="M64 43v67M118 43v67" stroke="#ac876a" strokeWidth="7" />
          <rect
            x="76"
            y="66"
            width="30"
            height="23"
            rx="3"
            fill="#e7e9d4"
            transform="rotate(-12 90 78)"
          />
          <circle cx="64" cy="119" r="5" fill="#344652" />
          <circle cx="118" cy="119" r="5" fill="#344652" />
        </>
      ) : kind === 'shield' ? (
        <>
          <path d="M90 12 139 31v32q0 35-49 60Q41 98 41 63V31Z" fill="#a5bfb0" {...line} />
          <path
            d="m66 65 17 17 32-38"
            fill="none"
            stroke="#fdf5df"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </>
      ) : kind === 'search' ? (
        <>
          <path d="M30 24h90v91H30Z" fill="#f6eddb" {...line} />
          <path
            d="M45 43h56M45 57h40M45 71h55M45 85h27"
            stroke="#a0afb0"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="110" cy="73" r="26" fill="#c7e0df" fillOpacity=".8" {...line} />
          <path d="m129 92 26 27" stroke="#344652" strokeWidth="10" strokeLinecap="round" />
        </>
      ) : kind === 'chart' ? (
        <>
          <path d="M28 21h125v94H28Z" fill="#edf0dc" {...line} />
          <path d="M45 94V74h15v20m13 0V60h15v34m13 0V41h15v53" fill="#95b49c" />
          <path
            d="m43 60 28-18 20 6 43-30"
            fill="none"
            stroke="#ce9d63"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="m120 18 15-1-1 16" fill="none" stroke="#ce9d63" strokeWidth="5" />
        </>
      ) : kind === 'team' || kind === 'handshake' ? (
        <>
          <circle cx="60" cy="38" r="19" fill="#d8a17d" {...line} />
          <circle cx="118" cy="38" r="19" fill="#c98e71" {...line} />
          <path d="M26 110V79q34-33 65 0v31" fill="#789ba6" {...line} />
          <path d="M87 110V79q34-33 65 0v31" fill="#b2b993" {...line} />
          <path
            d="m63 87 19 10 25-16"
            fill="none"
            stroke="#e4bc94"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <rect
            x="29"
            y="42"
            width="124"
            height="74"
            rx="8"
            fill={kind === 'work' ? '#be9a78' : '#8cabb1'}
            {...line}
          />
          <path d="M68 41V24h43v17M30 70h121" fill="none" {...line} />
          <path d="M80 64h22v15H80Z" fill="#e4c38e" {...line} />
        </>
      )}
    </svg>
  );
});
