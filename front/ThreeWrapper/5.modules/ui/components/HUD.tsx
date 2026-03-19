export function HUD() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      gridTemplateAreas: `
        "topleft    topcenter    topright"
        "middleleft .            middleright"
        "botleft    botcenter    botright"
      `,
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr',
      padding: '16px',
      pointerEvents: 'none',
    }}>
      {}
      <div style={{ gridArea: 'topleft', alignSelf: 'start', justifySelf: 'start' }}>
        {}
      </div>
      {}
      <div style={{ gridArea: 'topcenter', alignSelf: 'start', justifySelf: 'center' }}>
        {}
      </div>
      {}
      <div style={{ gridArea: 'topright', alignSelf: 'start', justifySelf: 'end' }}>
        {}
      </div>
      {}
      <div style={{ alignSelf: 'center', justifySelf: 'center', gridColumn: '1 / -1' }}>
        {}
      </div>
      {}
      <div style={{ gridArea: 'botleft', alignSelf: 'end', justifySelf: 'start' }}>
        {}
      </div>
      {}
      <div style={{ gridArea: 'botcenter', alignSelf: 'end', justifySelf: 'center' }}>
        {}
      </div>
      {}
      <div style={{ gridArea: 'botright', alignSelf: 'end', justifySelf: 'end' }}>
        {}
      </div>
    </div>
  )
}
