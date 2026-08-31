const DISC_COUNT = 7;
const DISC_DEPTH_LAYER_COUNT = 17;

const depthLayers = Array.from(
  { length: DISC_DEPTH_LAYER_COUNT },
  (_, index) => {
    const progress = index / (DISC_DEPTH_LAYER_COUNT - 1);
    const centered = progress * 2 - 1;
    const bulge = 1 - centered * centered;
    const offset = (progress - 0.5) * 0.1;
    const scale = 0.965 + bulge * 0.035;
    const opacity = 0.05 + bulge * 0.05;

    return {
      offset: `${offset.toFixed(4)}em`,
      opacity: opacity.toFixed(3),
      scale: scale.toFixed(4),
    };
  },
);

export function AuthDiscRing() {
  return (
    <div className="auth-disc-ring" aria-hidden="true">
      <div className="disc-ring-spin">
        {Array.from({ length: DISC_COUNT }, (_, index) => (
          <span
            className="disc-slot"
            key={index}
            style={{ "--i": index } as React.CSSProperties}
          >
            <span className="disc">
              <span className="disc-face disc-face-back" />
              {depthLayers.map((depth, depthIndex) => (
                <span
                  className="disc-depth-layer"
                  key={depth.offset}
                  style={
                    {
                      "--depth-index": depthIndex,
                      "--depth-opacity": depth.opacity,
                      "--depth-scale": depth.scale,
                      "--depth-z": depth.offset,
                    } as React.CSSProperties
                  }
                />
              ))}
              <span className="disc-face disc-face-front" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
