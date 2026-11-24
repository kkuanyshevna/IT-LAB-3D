(function createBoardRouteOverlay(THREE, root, microParts) {
  const overlay = new THREE.Group();
  root.add(overlay);
  const markers = [];
  let current, curve, playing = false, lastTime = 0, distance = 0;

  function point(value) {
    const [x, y] = typeof value === 'string' ? microParts.find(part => part.id === value).center : value;
    return new THREE.Vector3(x, y, -.39);
  }

  function clear() {
    const materials = new Set();
    for (const mesh of [...overlay.children]) {
      mesh.geometry.dispose();
      materials.add(mesh.material);
      overlay.remove(mesh);
    }
    for (const material of materials) material.dispose();
    markers.length = 0;
    current = curve = null;
    lastTime = distance = 0;
  }

  function material(color, options) {
    return new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, toneMapped: false, ...options });
  }

  function mesh(geometry, surface, position, order) {
    const object = new THREE.Mesh(geometry, surface);
    object.position.copy(position);
    object.renderOrder = order;
    overlay.add(object);
    return object;
  }

  function line(points, core, glow) {
    const path = new THREE.CurvePath();
    const nodes = points.map(point);
    for (let i = 1; i < nodes.length; i++) {
      const start = nodes[i - 1], end = nodes[i];
      const segment = new THREE.LineCurve3(start, end);
      const direction = end.clone().sub(start).normalize();
      for (const [radius, surface, order] of [[.027, glow, 15], [.009, core, 16]]) {
        const segmentMesh = mesh(new THREE.CylinderGeometry(radius, radius, segment.getLength(), 8), surface, segment.getPoint(.5), order);
        segmentMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      }
      path.add(segment);
    }
    for (const i of [0, nodes.length - 1]) {
      mesh(new THREE.RingGeometry(.042, .054, 24), core, nodes[i], 18);
    }
    return path;
  }

  function show(step, color, animate) {
    playing = animate;
    if (step === current) return;
    clear();
    if (!step) return;
    current = step;
    const core = material(step.color || color, {side: THREE.DoubleSide});
    const glow = material(step.color || color, {transparent: true, opacity: .22});
    curve = line(step.points, core, glow);
    for (const branch of step.branches || []) line(branch, core, glow);

    const direction = curve.getPoint(1).sub(curve.getPoint(.96)).normalize();
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(-.038, -.038);
    arrowShape.lineTo(.045, 0);
    arrowShape.lineTo(-.038, .038);
    arrowShape.closePath();
    const arrow = mesh(new THREE.ShapeGeometry(arrowShape), core, curve.getPoint(1).addScaledVector(direction, -.085), 19);
    arrow.rotation.z = Math.atan2(direction.y, direction.x);

    const pulse = material(0xfff3d9, {side: THREE.DoubleSide});
    for (let i = 0; i < 3; i++) {
      markers.push(mesh(new THREE.CircleGeometry(.019, 12), pulse, curve.getPoint((i + 1) / 4), 20));
    }
  }

  function frame(time) {
    if (!curve) return;
    const dt = lastTime ? Math.min(64, time - lastTime) : 0;
    lastTime = time;
    if (!playing) return;
    distance = (distance + dt / 1500) % 1;
    markers.forEach((marker, i) => marker.position.copy(curve.getPoint((distance + (i + 1) / 4) % 1)));
  }

  return {show, frame, clear};
})
