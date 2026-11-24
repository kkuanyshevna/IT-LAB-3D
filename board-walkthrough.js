(function() {
  'use strict';
  const routes = window.ITLAB_BOARD_ROUTES;
  const parts = new Map(window.ITLAB_MICRO_DATA.map(part => [part.id, part]));
  const $ = id => document.getElementById(id);
  const stepDuration = 7000;

  window.createBoardWalkthrough = function(inspector, updateCovers) {
    let route = routes[0], index = 0, playing = false, timer = null, routeView = false;
    const routeSelect = $('boardRouteSelect');
    for (const item of routes) routeSelect.add(new Option(item.label[0], item.id));

    function pause() {
      playing = false;
      clearTimeout(timer);
      timer = null;
    }

    function showDetails() {
      if (!routeView) return;
      pause();
      routeView = false;
      inspector()?.setRoute(null);
      updateCovers(inspector()?.getState().coversOff);
      $('boardDetailsTab').setAttribute('aria-pressed', 'true');
      $('boardRoutesTab').setAttribute('aria-pressed', 'false');
      $('boardDetailsPanel').hidden = false;
      $('boardRoutePanel').hidden = true;
    }

    function showRoutes() {
      if (routeView || !inspector()?.getState().open) return;
      routeView = true;
      $('boardDetailsTab').setAttribute('aria-pressed', 'false');
      $('boardRoutesTab').setAttribute('aria-pressed', 'true');
      $('boardDetailsPanel').hidden = true;
      $('boardRoutePanel').hidden = false;
      render();
      inspector()?.frameRoute(route.steps);
    }

    function partLink(id) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.textContent = parts.get(id).name + ' ↗';
      button.addEventListener('click', () => {
        showDetails();
        inspector()?.focus(id);
        $('microCard').focus({preventScroll:true});
      });
      return button;
    }

    function render() {
      if (!routeView) return;
      const step = route.steps[index];
      $('boardRouteCount').textContent = `${index + 1} / ${route.steps.length}`;
      $('boardRouteTitle').textContent = step.title[0];
      $('boardRouteBody').textContent = step.body[0];
      $('boardRoutePanel').style.setProperty('--route-color', step.color || route.color);
      if ($('boardRouteSteps').childElementCount !== route.steps.length) {
        const buttons = route.steps.map((_, at) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = at + 1;
          button.addEventListener('click', () => go(at));
          return button;
        });
        $('boardRouteSteps').replaceChildren(...buttons);
      }
      Array.from($('boardRouteSteps').children).forEach((button, at) => {
        button.setAttribute('aria-label', `Шаг ${at + 1}: ${route.steps[at].title[0]}`);
        if (at === index) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      const nodes = [...new Set([...step.points, ...(step.branches || []).flat()].filter(node => parts.has(node)))];
      $('boardRouteLinks').replaceChildren(...nodes.map(partLink));
      $('boardRoutePrev').disabled = index === 0;
      $('boardRouteNext').disabled = index === route.steps.length - 1;
      $('boardRoutePlay').textContent = playing ? 'Пауза' : 'Автопоказ';
      $('boardRoutePlay').setAttribute('aria-pressed', String(playing));
      inspector()?.setRoute(step, route.color, playing);
      updateCovers(inspector()?.getState().coversOff);
    }

    function go(step) {
      pause();
      index = step;
      render();
    }

    function schedule() {
      timer = setTimeout(() => {
        if (index === route.steps.length - 1) pause();
        else { index++; schedule(); }
        render();
      }, stepDuration);
    }

    $('boardDetailsTab').addEventListener('click', showDetails);
    $('boardRoutesTab').addEventListener('click', showRoutes);
    routeSelect.addEventListener('change', () => {
      route = routes.find(item => item.id === routeSelect.value) || routes[0];
      go(0);
      inspector()?.frameRoute(route.steps);
    });
    $('boardRoutePrev').addEventListener('click', () => go(index - 1));
    $('boardRouteNext').addEventListener('click', () => go(index + 1));
    $('boardRoutePlay').addEventListener('click', () => {
      if (playing) pause();
      else {
        if (index === route.steps.length - 1) index = 0;
        playing = true;
        schedule();
      }
      render();
    });
    return {showDetails};
  };
})();
