import { useState, useRef, useCallback } from "react";

const LANGUAGES = ["Tamil", "Hindi", "Telugu", "English", "Malayalam", "Kannada", "Punjabi"];

const EMOTION_THEMES = {
  happy:    { accent: "#FFD93D", glow: "#FFD93D40", emoji: "😄", particle: "✦", label: "HAPPY"    },
  sad:      { accent: "#6C9BCF", glow: "#6C9BCF40", emoji: "😢", particle: "·", label: "SAD"      },
  angry:    { accent: "#FF6B6B", glow: "#FF6B6B40", emoji: "😠", particle: "!", label: "ANGRY"    },
  fear:     { accent: "#A29BFE", glow: "#A29BFE40", emoji: "😨", particle: "~", label: "FEAR"     },
  neutral:  { accent: "#94A3B8", glow: "#94A3B840", emoji: "😐", particle: "○", label: "NEUTRAL"  },
  surprise: { accent: "#FD79A8", glow: "#FD79A840", emoji: "😲", particle: "★", label: "SURPRISE" },
};

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function Particles({ theme }) {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
      {Array.from({length:14},(_,i)=>(
        <span key={i} style={{
          position:"absolute",
          left:`${(i*7.1)%100}%`, top:`${(i*11+5)%90}%`,
          fontSize:`${8+(i%4)*5}px`, color:theme.accent,
          opacity:0.12+(i%5)*0.06, fontWeight:"bold",
          animation:`floatP ${3+(i%3)}s ease-in-out infinite`,
          animationDelay:`${i*0.35}s`,
        }}>{theme.particle}</span>
      ))}
    </div>
  );
}

function UploadZone({ onFile, preview }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const drop = useCallback(e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) onFile(f);
  }, [onFile]);
  return (
    <div onClick={()=>ref.current.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true);}}
      onDragLeave={()=>setDrag(false)} onDrop={drop}
      style={{
        border:`2px dashed ${drag?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.25)"}`,
        borderRadius:"20px", cursor:"pointer",
        transition:"all 0.3s", transform:drag?"scale(1.02)":"scale(1)",
        background:drag?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.06)",
        backdropFilter:"blur(8px)", overflow:"hidden",
        minHeight:preview?"260px":"180px",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}}
        onChange={e=>e.target.files[0]&&onFile(e.target.files[0])}/>
      {preview
        ? <img src={preview} alt="" style={{width:"100%",height:"260px",objectFit:"cover",borderRadius:"18px",display:"block"}}/>
        : <div style={{textAlign:"center",color:"rgba(255,255,255,0.7)",padding:"2rem"}}>
            <div style={{fontSize:"48px",marginBottom:"10px"}}>📸</div>
            <p style={{fontSize:"16px",fontWeight:"800",letterSpacing:"0.08em",margin:0}}>DROP YOUR SELFIE</p>
            <p style={{fontSize:"12px",opacity:0.5,marginTop:"5px"}}>or click to browse</p>
          </div>
      }
    </div>
  );
}

function EmotionBar({label,value,accent}) {
  return (
    <div style={{marginBottom:"7px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
        <span style={{fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.55)",fontWeight:"700"}}>{label}</span>
        <span style={{fontSize:"10px",color:"rgba(255,255,255,0.85)",fontWeight:"700"}}>{value.toFixed(1)}%</span>
      </div>
      <div style={{height:"3px",background:"rgba(255,255,255,0.1)",borderRadius:"2px",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,background:accent,borderRadius:"2px",
          transition:"width 1.2s cubic-bezier(0.4,0,0.2,1)",boxShadow:`0 0 6px ${accent}80`}}/>
      </div>
    </div>
  );
}

// Spotify-style player card
function SongCard({ song, accent, isPlaying, onPlay }) {
  return (
    <div style={{
      background:"rgba(255,255,255,0.07)", backdropFilter:"blur(16px)",
      borderRadius:"14px", overflow:"hidden",
      border:`1px solid ${isPlaying ? accent+"70" : "rgba(255,255,255,0.1)"}`,
      transition:"border 0.25s, box-shadow 0.25s",
      boxShadow: isPlaying ? `0 0 18px ${accent}30` : "none",
    }}>
      {/* Thumbnail + play overlay */}
      <div style={{position:"relative",cursor:"pointer"}} onClick={onPlay}>
        <img src={song.thumbnail} alt={song.title}
          style={{width:"100%",height:"110px",objectFit:"cover",display:"block"}}/>
        <div style={{
          position:"absolute",inset:0,
          background: isPlaying ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.42)",
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all 0.2s",
        }}>
          {isPlaying
            ? <div style={{display:"flex",gap:"3px",alignItems:"flex-end"}}>
                {[10,16,8,14,12].map((h,i)=>(
                  <div key={i} style={{width:"3px",height:`${h}px`,background:accent,borderRadius:"2px",
                    animation:`bar ${0.5+i*0.1}s ease-in-out infinite alternate`,animationDelay:`${i*0.1}s`}}/>
                ))}
              </div>
            : <div style={{
                width:"32px",height:"32px",borderRadius:"50%",
                background:accent,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:"12px",boxShadow:`0 4px 10px ${accent}60`,
              }}>▶</div>
          }
        </div>
      </div>

      {/* Info row */}
      <div style={{padding:"7px 9px 9px",display:"flex",alignItems:"center",gap:"6px"}}>
        <div style={{flex:1,minWidth:0}}>
          <p style={{
            color:"#fff",fontSize:"10px",fontWeight:"700",margin:0,lineHeight:"1.3",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"
          }}>{song.title}</p>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:"9px",margin:"2px 0 0",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{song.channel}</p>
        </div>
        <a href={song.url} target="_blank" rel="noreferrer"
          onClick={e=>e.stopPropagation()}
          style={{color:"rgba(255,255,255,0.35)",fontSize:"13px",textDecoration:"none",flexShrink:0}}
          title="Open in YouTube">⧉</a>
      </div>
    </div>
  );
}

export default function App() {
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [lang,    setLang]    = useState("Tamil");
  const [vibe,    setVibe]    = useState("match");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [playing, setPlaying] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageToken, setPageToken] = useState(null);
  const [queryIndex, setQueryIndex] = useState(0);
  const [seenIds, setSeenIds] = useState([]);

  const theme = result ? EMOTION_THEMES[result.emotion] : null;

  const handleFile = f => {
    setFile(f); setPreview(URL.createObjectURL(f));
    setResult(null); setError(null); setPlaying(null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(null); setPlaying(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("language", lang);
      fd.append("mood_type", vibe);
      const res  = await fetch(`${API}/detect`, { method:"POST", body:fd });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setResult(data);
        setSeenIds((data.songs||[]).map(s => s.video_id));
        setPageToken(data.next_page_token || null);
        setQueryIndex(data.query_index || 0);
      }
    } catch {
      setError("Cannot connect to backend. Make sure FastAPI is running on port 8000.");
    }
    setLoading(false);
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); setPlaying(null); setPageToken(null); setQueryIndex(0); setSeenIds([]); };

  const loadMore = async () => {
    if (!result) return;
    setLoadingMore(true);
    try {
      const fd = new FormData();
      fd.append("emotion", result.emotion);
      fd.append("language", result.language || lang);
      fd.append("mood_type", vibe);
      fd.append("query_index", queryIndex);
      if (pageToken) fd.append("page_token", pageToken);
      fd.append("seen_ids", seenIds.join(","));
      const res = await fetch(`${API}/more`, { method:"POST", body:fd });
      const data = await res.json();
      if (data.songs && data.songs.length > 0) {
        setResult(prev => ({ ...prev, songs: [...prev.songs, ...data.songs] }));
        setSeenIds(prev => [...prev, ...data.songs.map(s => s.video_id)]);
        setPageToken(data.next_page_token || null);
        setQueryIndex(data.query_index || 0);
      }
    } catch(e) { console.error(e); }
    setLoadingMore(false);
  };

  const bgGrad = theme
    ? `linear-gradient(140deg, #0a0a0a 0%, ${theme.accent}22 50%, #0a0a0a 100%)`
    : `linear-gradient(140deg, #0d0d1a, #111827, #0d0d1a)`;

  return (
    <div style={{minHeight:"100vh", background:bgGrad, transition:"background 1.2s ease",
      fontFamily:"'Syne','Space Grotesk',sans-serif", overflowX:"hidden", position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        @keyframes floatP{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bar{from{transform:scaleY(0.4)}to{transform:scaleY(1)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
        select option{background:#111827}
      `}</style>

      {theme && <Particles theme={theme}/>}

      <div style={{maxWidth:"460px",margin:"0 auto",padding:"2rem 1.1rem",position:"relative",zIndex:1}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:"1.8rem",animation:"slideUp 0.5s ease"}}>
          <p style={{fontSize:"10px",letterSpacing:"0.3em",color:"rgba(255,255,255,0.35)",fontWeight:"700",marginBottom:"5px"}}>
            AI · EMOTION · MUSIC
          </p>
          <h1 style={{fontSize:"44px",fontWeight:"800",color:"#fff",letterSpacing:"-0.04em",lineHeight:1}}>
            MOOD<span style={{color:theme?.accent||"rgba(255,255,255,0.9)",transition:"color 1s"
            }}>TUNES</span>
          </h1>
          <p style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginTop:"6px",letterSpacing:"0.12em"}}>
            YOUR FACE · YOUR VIBE · YOUR MUSIC
          </p>
        </div>

        {/* Upload */}
        <div style={{marginBottom:"1rem",animation:"slideUp 0.5s ease 0.08s both"}}>
          <UploadZone onFile={handleFile} preview={preview}/>
        </div>

        {/* Language + Vibe controls */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"1rem",animation:"slideUp 0.5s ease 0.16s both"}}>
          <div>
            <p style={{fontSize:"9px",letterSpacing:"0.2em",color:"rgba(255,255,255,0.4)",marginBottom:"5px",fontWeight:"700"}}>LANGUAGE</p>
            <select value={lang} onChange={e=>setLang(e.target.value)} style={{
              width:"100%",padding:"9px 12px",borderRadius:"12px",
              background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",
              color:"#fff",fontSize:"13px",fontWeight:"600",fontFamily:"inherit",
              cursor:"pointer",outline:"none",appearance:"none",
            }}>
              {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <p style={{fontSize:"9px",letterSpacing:"0.2em",color:"rgba(255,255,255,0.4)",marginBottom:"5px",fontWeight:"700"}}>VIBE</p>
            <div style={{display:"flex",gap:"6px"}}>
              {[["match","Match"],["opposite","Uplift"]].map(([v,label])=>(
                <button key={v} onClick={()=>setVibe(v)} style={{
                  flex:1,padding:"9px 4px",borderRadius:"12px",fontSize:"12px",
                  fontWeight:"700",fontFamily:"inherit",cursor:"pointer",
                  border:vibe===v?`2px solid ${theme?.accent||"#fff"}`:"1px solid rgba(255,255,255,0.15)",
                  background:vibe===v?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.05)",
                  color:"#fff",transition:"all 0.2s",
                }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Detect button */}
        <button onClick={analyze} disabled={!file||loading} style={{
          width:"100%",padding:"15px",borderRadius:"14px",border:"none",
          background:file&&!loading?(theme?.accent||"#fff"):"rgba(255,255,255,0.1)",
          color:file&&!loading?"#000":"rgba(255,255,255,0.3)",
          fontSize:"13px",fontWeight:"800",letterSpacing:"0.2em",
          cursor:file&&!loading?"pointer":"not-allowed",
          transition:"all 0.3s",fontFamily:"inherit",marginBottom:"1.4rem",
          animation:"slideUp 0.5s ease 0.24s both",
          boxShadow:file&&!loading?`0 8px 28px ${theme?.accent||"#fff"}35`:"none",
        }}>
          {loading
            ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}>
                <span style={{width:"14px",height:"14px",border:"2px solid #00000030",borderTopColor:"#000",
                  borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/>
                READING YOUR VIBE...
              </span>
            : "✦  DETECT MY MOOD"
          }
        </button>

        {error && (
          <div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.35)",
            borderRadius:"12px",padding:"11px 14px",marginBottom:"1.4rem",
            color:"#fca5a5",fontSize:"12px",textAlign:"center",fontWeight:"600"}}>
            ⚠ {error}
          </div>
        )}

        {/* ─── Result ─── */}
        {result && (
          <div style={{animation:"slideUp 0.45s ease"}}>

            {/* Emotion card */}
            <div style={{
              background:"rgba(255,255,255,0.07)",backdropFilter:"blur(20px)",
              borderRadius:"22px",padding:"1.3rem",
              border:`1px solid ${result.color}40`,marginBottom:"1.1rem",
              boxShadow:`0 0 40px ${result.color}20`,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"1.1rem"}}>
                <div style={{fontSize:"58px",lineHeight:1,
                  animation:"pulse 2.5s ease infinite",
                  filter:`drop-shadow(0 0 10px ${result.color}70)`}}>
                  {result.emoji}
                </div>
                <div>
                  <p style={{fontSize:"9px",letterSpacing:"0.2em",color:"rgba(255,255,255,0.4)",fontWeight:"700"}}>DETECTED EMOTION</p>
                  <h2 style={{fontSize:"34px",fontWeight:"800",color:"#fff",
                    letterSpacing:"-0.02em",lineHeight:1,marginTop:"2px"}}>
                    {result.emotion.toUpperCase()}
                  </h2>
                  <p style={{fontSize:"12px",color:result.color,fontWeight:"700",marginTop:"2px"}}>
                    {result.confidence.toFixed(1)}% confidence
                  </p>
                </div>
              </div>
              {Object.entries(result.all_scores).sort((a,b)=>b[1]-a[1]).map(([lbl,val])=>(
                <EmotionBar key={lbl} label={lbl} value={val} accent={result.color}/>
              ))}
            </div>



            {/* Songs header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.8rem"}}>
              <p style={{fontSize:"10px",letterSpacing:"0.2em",color:"rgba(255,255,255,0.4)",fontWeight:"700"}}>
                🎵 {result.language?.toUpperCase()} PICKS
              </p>
              <span style={{fontSize:"9px",padding:"3px 10px",borderRadius:"20px",
                background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",
                fontWeight:"700",letterSpacing:"0.1em"}}>
                {vibe==="match"?"VIBE MATCH":"MOOD LIFT"}
              </span>
            </div>

            {/* Song grid — always 2 columns, player expands below */}
            {result.songs.length === 0
              ? <div style={{textAlign:"center",padding:"2rem",color:"rgba(255,255,255,0.3)",fontSize:"13px"}}>
                  No songs found. Check your YouTube API key.
                </div>
              : <>
                  <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:"8px",marginBottom:"1rem"}}>
                    {result.songs.map((song,i)=>(
                      <div key={song.video_id} style={{animation:`slideUp 0.4s ease both`,animationDelay:`${i*0.07}s`}}>
                        <SongCard
                          song={song} accent={result.color}
                          isPlaying={playing===song.video_id}
                          onPlay={()=>setPlaying(playing===song.video_id?null:song.video_id)}
                        />
                      </div>
                    ))}
                  </div>
                  {playing && (() => {
                    const s = result.songs.find(x=>x.video_id===playing);
                    if (!s) return null;
                    return (
                      <div style={{borderRadius:"16px",position:"relative",marginBottom:"1rem",
                        border:`1px solid ${result.color}50`,boxShadow:`0 0 28px ${result.color}22`,
                        animation:"slideUp 0.3s ease"}}>
                        <div style={{padding:"8px 12px",background:`${result.color}15`,
                          display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"8px",minWidth:0}}>
                            <div style={{display:"flex",gap:"2px",alignItems:"flex-end",flexShrink:0}}>
                              {[7,13,5,11,9].map((h,i)=>(
                                <div key={i} style={{width:"2px",height:`${h}px`,background:result.color,borderRadius:"1px",
                                  animation:`bar ${0.5+i*0.1}s ease-in-out infinite alternate`,animationDelay:`${i*0.1}s`}}/>
                              ))}
                            </div>
                            <span style={{fontSize:"10px",color:"rgba(255,255,255,0.65)",fontWeight:"700",
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</span>
                          </div>
                          <button onClick={()=>setPlaying(null)} style={{
                            background:"rgba(255,255,255,0.08)",border:"none",borderRadius:"6px",
                            color:"rgba(255,255,255,0.55)",fontSize:"9px",cursor:"pointer",
                            padding:"3px 8px",fontFamily:"inherit",fontWeight:"700",flexShrink:0,
                          }}>■ STOP</button>
                        </div>
                        <iframe src={s.embed_url} title="Now playing"
                          style={{width:"1px",height:"1px",border:"none",display:"block",opacity:0,position:"absolute"}}
                          allow="autoplay; encrypted-media" allowFullScreen/>
                      </div>
                    );
                  })()}
                </>
            }

            {/* Load More */}
            <button onClick={loadMore} disabled={loadingMore} style={{
              width:"100%",padding:"13px",borderRadius:"13px",
              border:`1px solid ${result.color}50`,
              background:`${result.color}12`,
              color: loadingMore ? "rgba(255,255,255,0.3)" : result.color,
              fontSize:"11px",fontWeight:"800",letterSpacing:"0.18em",
              cursor: loadingMore ? "not-allowed" : "pointer",
              fontFamily:"inherit",marginBottom:"10px",transition:"all 0.2s",
              display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
            }}
              onMouseEnter={e=>{ if(!loadingMore) e.currentTarget.style.background=`${result.color}22`; }}
              onMouseLeave={e=>{ if(!loadingMore) e.currentTarget.style.background=`${result.color}12`; }}
            >
              {loadingMore
                ? <><span style={{width:"12px",height:"12px",border:`2px solid ${result.color}40`,
                    borderTopColor:result.color,borderRadius:"50%",
                    animation:"spin 0.8s linear infinite",display:"inline-block"}}/> LOADING MORE...</>
                : <>✦ EXPLORE MORE SONGS</>
              }
            </button>

            {/* Reset */}
            <button onClick={reset} style={{
              width:"100%",padding:"13px",borderRadius:"13px",
              border:"1px solid rgba(255,255,255,0.12)",
              background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",
              fontSize:"11px",fontWeight:"700",letterSpacing:"0.18em",
              cursor:"pointer",fontFamily:"inherit",marginBottom:"2rem",transition:"all 0.2s",
            }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}
            >↺  TRY ANOTHER PHOTO</button>
          </div>
        )}
      </div>
    </div>
  );
}