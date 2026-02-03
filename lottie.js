// ============================
// КОНФИГУРАЦИЯ
// ============================
const config = {
  // Настройки wrapper
  wrapperSelector: '.wrapper',
  
  // Основная Lottie анимация
  animationPath: 'https://storage.yandexcloud.net/external-assets/tantum/animations/lottie/jump.json',
  // НОВЫЕ ПАРАМЕТРЫ ДЛЯ РАЗНЫХ УСТРОЙСТВ
  animationSize: {
    desktop: {
      width: 556,    // Больше на компьютере
      height: 444
    },
    mobile: {
      width: 292,    // Меньше на мобилке
      height: 208
    }
  },
  
  // Анимация следов снега
  snowTrails: {
    enabled: true,
    lottiePath: 'https://storage.yandexcloud.net/external-assets/tantum/animations/lottie/snow.json',
    size: {
      desktop: {
        width: 556,
        height: 444
      },
      mobile: {
        width: 292,
        height: 208
      }
    },
    opacity: 1,
    zIndex: '1001',
    showOnMovement: true,
    fadeInDuration: 500,
    fadeOutDuration: 1000,
    trailDelay: 300,
    reflectWithMain: true,
  },
  
  // Скорости движения для разных устройств
  movement: {
    enabled: true,
    speeds: {
      desktop: {
        horizontal: 120,  // Быстрее на десктопе
        vertical: 70
      },
      mobile: {
        horizontal: 100,  // Медленнее на мобилке
        vertical: 60
      }
    },
    moveInViewport: true,
    startDelay: 1000, // ЗАДЕРЖКА ПЕРЕД СТАРТОМ ДВИЖЕНИЯ
    startPosition: { x: 'left', y: 'top' },
    bounceAtEdges: true,
    edgeMargin: 0,
    flipAnimation: true,
    flipDuration: 300,
    pauseOnHover: true,
    oneTime: false,
    
    // НОВЫЙ ПАРАМЕТР: Перезапуск при достижении низа
    restartOnBottom: true, // Включить перезапуск
    restartDelay: 10000,   // Задержка 10 секунд перед перезапуском
    bottomThreshold: 10,   // Порог для определения "низа" (в пикселях)
  },
  
  // Задержки и тайминги
  delays: {
    containerAppearance: 500,
    animationStart: 500,
    movementStart: 2000, // ЭТО ОБЩАЯ ЗАДЕРЖКА ДО НАЧАЛА ДВИЖЕНИЯ
  },
  
  // Стили для контейнера анимации
  animationStyles: {
    pointerEvents: 'none',
    zIndex: '1001',
    transformOrigin: 'center center',
    willChange: 'transform'
  }
};

// ============================
// УТИЛИТЫ ДЛЯ ОПРЕДЕЛЕНИЯ УСТРОЙСТВА
// ============================

// Функция для определения типа устройства
function getDeviceType() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const isTablet = window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches;
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

// Функция для получения размеров анимации
function getAnimationSize() {
  const device = getDeviceType();
  return config.animationSize[device] || config.animationSize.desktop;
}

// Функция для получения размеров следов снега
function getSnowTrailsSize() {
  const device = getDeviceType();
  return config.snowTrails.size[device] || config.snowTrails.size.desktop;
}

// Функция для получения скоростей движения
function getMovementSpeeds() {
  const device = getDeviceType();
  const speeds = config.movement.speeds[device] || config.movement.speeds.desktop;
  return {
    horizontalSpeed: speeds.horizontal,
    verticalSpeed: speeds.vertical
  };
}

// ============================
// ОСНОВНОЙ СКРИПТ
// ============================

document.addEventListener('DOMContentLoaded', function() {
  // Определяем тип устройства
  const deviceType = getDeviceType();
  
  const wrapper = document.querySelector(config.wrapperSelector);
  
  if (!wrapper) {
    return;
  }
  
  const wrapperPosition = window.getComputedStyle(wrapper).position;
  if (wrapperPosition === 'static') {
    wrapper.style.position = 'relative';
  }
  
  // Получаем размеры для текущего устройства
  const animationSize = getAnimationSize();
  const snowTrailsSize = getSnowTrailsSize();
  const movementSpeeds = getMovementSpeeds();
  
  // Создаем контейнеры с правильными размерами
  const lottieContainer = createLottieContainer(animationSize);
  const snowTrailsContainer = createSnowTrailsContainer(snowTrailsSize);
  
  setTimeout(() => {
    wrapper.appendChild(snowTrailsContainer);
    wrapper.appendChild(lottieContainer);
    
    if (config.movement.moveInViewport) {
      makeFixedToViewport(lottieContainer);
      makeFixedToViewport(snowTrailsContainer);
    }
    
    setTimeout(() => {
      const mainAnimation = initLottie(lottieContainer, config.animationPath);
      const snowAnimation = initLottie(snowTrailsContainer, config.snowTrails.lottiePath, true);
      
      if (config.movement.enabled) {
        // ИСПОЛЬЗУЕМ ЗАДЕРЖКУ ИЗ КОНФИГА
        const movementDelay = config.delays?.movementStart || config.movement.startDelay;
        
        setTimeout(() => {
          // Передаем размеры и скорости в функцию движения
          startMovementAnimation(
            lottieContainer, 
            snowTrailsContainer, 
            mainAnimation, 
            snowAnimation,
            animationSize,
            snowTrailsSize,
            movementSpeeds
          );
        }, movementDelay);
      }
    }, config.delays.animationStart);
    
  }, config.delays.containerAppearance);
  
  // Функция создания контейнера для основной анимации
  function createLottieContainer(size) {
    const container = document.createElement('div');
    container.className = 'lottie-mascot-main';
    
    Object.assign(container.style, {
      position: 'fixed',
      width: `${size.width}px`,
      height: `${size.height}px`,
      opacity: '0',
      transition: 'opacity 0.5s ease-in',
      pointerEvents: 'none',
      ...config.animationStyles
    });

    return container;
  }
  
  // Функция создания контейнера для следов снега
  function createSnowTrailsContainer(size) {
    if (!config.snowTrails.enabled) return null;
    
    const container = document.createElement('div');
    container.className = 'snow-trails-container';
    
    Object.assign(container.style, {
      position: 'fixed',
      width: `${size.width}px`,
      height: `${size.height}px`,
      opacity: '0',
      pointerEvents: 'none',
      zIndex: config.snowTrails.zIndex,
      transformOrigin: 'center center',
      transition: `opacity ${config.snowTrails.fadeInDuration}ms ease-in`,
      textDecoration: 'none',
      display: 'block'
    });
    
    // Эффект при наведении
    container.addEventListener('mouseenter', function() {
      container.style.opacity = '0.8';
    });
    
    container.addEventListener('mouseleave', function() {
      container.style.opacity = config.snowTrails.opacity;
    });
    
    return container;
  }
  
  // Функция для фиксированного позиционирования в viewport
  function makeFixedToViewport(container) {
    if (!container) return;
    container.style.position = 'fixed';
    container.style.left = '0px';
    container.style.top = '70px';
  }
  
  // Универсальная функция инициализации Lottie
  function initLottie(container, path, isSnowTrails = false) {
    if (!container) return null;
    
    if (typeof lottie === 'undefined') {
      return loadLottieLibrary(container, path, isSnowTrails);
    }
    
    return loadAnimation(container, path, isSnowTrails);
  }
  
  function loadLottieLibrary(container, path, isSnowTrails) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
    
    script.onload = function() {
      return loadAnimation(container, path, isSnowTrails);
    };
    
    document.head.appendChild(script);
    return null;
  }
  
  function loadAnimation(container, path, isSnowTrails = false) {
    
    const animation = lottie.loadAnimation({
      container: container,
      renderer: 'svg',
      loop: isSnowTrails,
      autoplay: true,
      path: path
    });
    
    animation.addEventListener('DOMLoaded', function() {
      if (!isSnowTrails) {
        container.style.opacity = '1';
      }
    });
    
    return animation;
  }
  
  // Функция для анимации движения (обновленная)
  function startMovementAnimation(
    mainContainer, 
    snowContainer, 
    mainAnimation, 
    snowAnimation,
    animationSize,
    snowTrailsSize,
    movementSpeeds
  ) {
    let animationId = null;
    let lastTimestamp = null;
    let isPaused = false;
    let isFlipping = false;
    let flipStartTime = null;
    let currentDirection = 'right';
    let verticalDirection = 'down';
    let flipProgress = 0;
    let animationCompleted = false;
    
    // НОВАЯ ПЕРЕМЕННАЯ: флаг для перезапуска
    let isRestarting = false;
    let restartTimeoutId = null;
    
    // НОВЫЕ ПЕРЕМЕННЫЕ: сохраняем начальную позицию И ЗАДЕРЖКУ
    let initialPosition = null;
    let initialDirection = null;
    let initialScaleX = null;
    let initialMovementDelay = null; // Сохраняем задержку старта
    
    // НОВАЯ ПЕРЕМЕННАЯ: флаг первого проигрывания
    let isFirstPlay = true;
    
    let snowTrailsVisible = false;
    let snowTrailsShown = false;
    let movementStarted = false;
    
    let currentX = 0;
    let currentY = 0;
    let scaleX = 1;
    let lastFlipTime = 0;
    const flipCooldown = 300;
    
    let enableTeleportation = false;
    
    // ПОЛУЧАЕМ СКОРОСТИ ИЗ ПАРАМЕТРОВ
    const horizontalSpeed = movementSpeeds.horizontalSpeed;
    const verticalSpeed = movementSpeeds.verticalSpeed;
    
    mainContainer.style.opacity = '1';
    
    // НОВАЯ ФУНКЦИЯ: Проверка достижения нижней части экрана
    function isAtBottom() {
      const viewportHeight = window.innerHeight;
      const elementHeight = animationSize.height;
      const bottomThreshold = config.movement.bottomThreshold || 10;
      
      return currentY + elementHeight >= viewportHeight - bottomThreshold;
    }
    
    // НОВАЯ ФУНКЦИЯ: Сохранение начальной позиции И ЗАДЕРЖКИ
    function saveInitialPosition() {
      initialPosition = {
        x: currentX,
        y: currentY
      };
      initialDirection = currentDirection;
      initialScaleX = scaleX;
      // Сохраняем задержку из конфига
      initialMovementDelay = config.delays?.movementStart || config.movement.startDelay;
    }
    
    // НОВАЯ ФУНКЦИЯ: Восстановление начальной позиции
    function restoreInitialPosition() {
      if (!initialPosition) return;
      
      currentX = initialPosition.x;
      currentY = initialPosition.y;
      currentDirection = initialDirection;
      scaleX = initialScaleX;
      
      mainContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
    }
    
    // НОВАЯ ФУНКЦИЯ: Перезапуск анимации С ЗАДЕРЖКОЙ
    function restartAnimation() {
      if (isRestarting || animationCompleted) return;
    
      isRestarting = true;
      isFirstPlay = false; // Устанавливаем флаг, что это уже не первый проигрыш
    
      // Останавливаем текущую анимацию
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      
      // Скрываем следы снега
      if (snowContainer && snowTrailsVisible) {
        hideSnowTrails();
      }
      
      // Скрываем основную анимацию с эффектом исчезновения
      mainContainer.style.transition = 'opacity 1s ease-out';
      mainContainer.style.opacity = '0';
      
      // Останавливаем Lottie анимацию
      if (mainAnimation) {
        mainAnimation.pause();
      }
      if (snowAnimation) {
        snowAnimation.pause();
      }
      
      // Устанавливаем таймер для перезапуска
      restartTimeoutId = setTimeout(() => {
        
        // Сбрасываем флаги движения
        movementStarted = false;
        snowTrailsShown = false;
        snowTrailsVisible = false;
        lastTimestamp = null;
        isFlipping = false;
        flipStartTime = null;
        
        // ВОССТАНАВЛИВАЕМ НАЧАЛЬНУЮ ПОЗИЦИЮ
        restoreInitialPosition();
        
        // Сбрасываем вертикальное направление
        verticalDirection = 'down';
        
        // Показываем анимацию
        mainContainer.style.transition = 'opacity 0.8s ease-in';
        mainContainer.style.opacity = '1';
        
        // Перезапускаем Lottie анимацию
        if (mainAnimation) {
          mainAnimation.goToAndPlay(0);
        }
        if (snowAnimation) {
          snowAnimation.goToAndPlay(0);
        }
        
        // ЗАПУСКАЕМ ДВИЖЕНИЕ С ЗАДЕРЖКОЙ ТОЛЬКО ПРИ ПЕРЕЗАПУСКЕ (не при первом проигрывании)
        if (!isFirstPlay) {
          // ЖДЕМ СОХРАНЕННУЮ ЗАДЕРЖКУ ПЕРЕД НАЧАЛОМ ДВИЖЕНИЯ ТОЛЬКО ПРИ ПЕРЕЗАПУСКЕ
          setTimeout(() => {
            isRestarting = false;
            
            // Запускаем движение снова
            animationId = requestAnimationFrame(animate);
          
          }, initialMovementDelay);
        } else {
          // Если это первый проигрыш, сразу запускаем движение без задержки

          isRestarting = false;
          animationId = requestAnimationFrame(animate);
        }
        
      }, config.movement.restartDelay);
    }
    
    function showSnowTrails() {
      if (!snowContainer || snowTrailsShown || !config.snowTrails.showOnMovement) return;
      

      snowTrailsShown = true;
      
      const snowX = currentX;
      const snowY = currentY;
      snowContainer.style.transform = `translate(${snowX}px, ${snowY}px) scaleX(${scaleX})`;
      
      setTimeout(() => {
        if (snowContainer && !animationCompleted && !isRestarting) {
          snowContainer.style.transition = `opacity ${config.snowTrails.fadeInDuration}ms ease-in`;
          snowContainer.style.opacity = config.snowTrails.opacity;
          snowTrailsVisible = true;

        }
      }, config.snowTrails.trailDelay);
    }
    
    function hideSnowTrails() {
      if (!snowContainer || !snowTrailsVisible) return;
 
      snowTrailsVisible = false;
      
      snowContainer.style.transition = `opacity ${config.snowTrails.fadeOutDuration}ms ease-out`;
      snowContainer.style.opacity = '0';
      
      setTimeout(() => {
        if (snowContainer && !animationCompleted && !snowTrailsVisible && !isRestarting) {
          snowTrailsShown = false;

        }
      }, config.snowTrails.fadeOutDuration + 100);
    }
    
    function setInitialPosition() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementWidth = animationSize.width;
      const elementHeight = animationSize.height;
      
      // Используем настройки из конфига
      if (config.movement.startPosition.x === 'left') {
        currentX = 0;
        currentDirection = 'right';
        scaleX = 1;
      } else if (config.movement.startPosition.x === 'right') {
        currentX = viewportWidth - elementWidth;
        currentDirection = 'left';
        scaleX = -1;
      } else if (config.movement.startPosition.x === 'random') {
        const startFromLeft = Math.random() > 0.5;
        if (startFromLeft) {
          currentX = 20;
          currentDirection = 'right';
          scaleX = 1;
        } else {
          currentX = viewportWidth - elementWidth - 20;
          currentDirection = 'left';
          scaleX = -1;
        }
      } else {
        currentX = parseFloat(config.movement.startPosition.x) || 0;
        currentDirection = 'right';
        scaleX = 1;
      }
      
      // Начальная позиция Y
      if (config.movement.startPosition.y === 'random') {
        currentY = Math.random() * (viewportHeight - elementHeight - 100) + 50;
      } else if (config.movement.startPosition.y === 'top') {
        currentY = 20;
      } else if (config.movement.startPosition.y === 'bottom') {
        currentY = viewportHeight - elementHeight - 20;
      } else if (config.movement.startPosition.y === 'center') {
        currentY = (viewportHeight - elementHeight) / 2;
      } else {
        if (typeof config.movement.startPosition.y === 'string' && 
            config.movement.startPosition.y.includes('%')) {
          const percent = parseFloat(config.movement.startPosition.y) / 100;
          currentY = (viewportHeight - elementHeight) * percent;
        } else {
          currentY = parseFloat(config.movement.startPosition.y) || 20;
        }
      }
      
      verticalDirection = 'down';
      
      mainContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
      
      // СОХРАНЯЕМ НАЧАЛЬНУЮ ПОЗИЦИЮ И ЗАДЕРЖКУ
      saveInitialPosition();
      
    }
    
    setInitialPosition();
    
    function shouldBounceHorizontal(x, viewportWidth, elementWidth) {
      if (!config.movement.bounceAtEdges) return false;
      
      const edgeMargin = config.movement.edgeMargin;
      
      if (currentDirection === 'left' && x <= edgeMargin) {
        return true;
      }
      
      if (currentDirection === 'right' && x >= viewportWidth - elementWidth - edgeMargin) {
        return true;
      }
      
      return false;
    }
    
    function shouldBounceVertical(y, viewportHeight, elementHeight) {
      if (!config.movement.bounceAtEdges) return false;
      
      const edgeMargin = config.movement.edgeMargin || 0;
      
      if (verticalDirection === 'down' && y >= viewportHeight - elementHeight - edgeMargin) {
        // Отключаем отскок при достижении низа, если включен перезапуск
        if (config.movement.restartOnBottom) {
          return false; // Не отскакиваем, а перезапускаем
        }
        return true;
      }
      
      if (verticalDirection === 'up' && y <= edgeMargin) {
        return true;
      }
      
      return false;
    }
    
    function checkAndTeleportIfNeeded(y, viewportHeight, elementHeight) {
      // Отключаем телепортацию, так как используем перезапуск
      return false;
    }
    
    function startFlip() {
      if (!isFlipping) {
        isFlipping = true;
        flipStartTime = performance.now();
        flipProgress = 0;
        lastFlipTime = flipStartTime;
        
        currentDirection = currentDirection === 'right' ? 'left' : 'right';
      }
    }
    
    function switchVerticalDirection() {
      verticalDirection = verticalDirection === 'down' ? 'up' : 'up';
    }
    
    function updateFlip(timestamp) {
      if (!flipStartTime) return false;
      
      flipProgress = Math.min(
        (timestamp - flipStartTime) / config.movement.flipDuration, 
        1
      );
      
      const targetScaleX = currentDirection === 'right' ? 1 : -1;
      
      const easing = flipProgress < 0.5 
        ? 2 * flipProgress * flipProgress 
        : 1 - Math.pow(-2 * flipProgress + 2, 2) / 2;
      
      scaleX = scaleX + (targetScaleX - scaleX) * easing;
      
      mainContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
      
      if (snowContainer && snowTrailsVisible) {      
        const snowX = currentX;
        const snowY = currentY;
        snowContainer.style.transform = `translate(${snowX}px, ${snowY}px) scaleX(${scaleX})`;
      }
      
      if (flipProgress >= 1) {
        isFlipping = false;
        flipStartTime = null;
        flipProgress = 0;
        scaleX = targetScaleX;
        
        mainContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
        
        if (snowContainer && snowTrailsVisible) {
          const snowX = currentX;
          const snowY = currentY;
          snowContainer.style.transform = `translate(${snowX}px, ${snowY}px) scaleX(${scaleX})`;
        }
        
        return false;
      }
      
      return true;
    }
    
    function updatePosition(timestamp) {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
        return;
      }
      
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      
      // ИСПОЛЬЗУЕМ ПЕРЕДАННЫЕ СКОРОСТИ
      const horizontalDistance = horizontalSpeed * deltaTime;
      const verticalDistance = verticalSpeed * deltaTime;
      
      const moved = Math.abs(horizontalDistance) > 0.1 || Math.abs(verticalDistance) > 0.1;
      
      if (moved && !movementStarted) {
        movementStarted = true;
        showSnowTrails();
      }
      
      if (!moved && movementStarted && snowTrailsVisible) {
        hideSnowTrails();
      }
      
      if (moved && movementStarted && !snowTrailsVisible && !snowTrailsShown) {
        showSnowTrails();
      }
      
      if (currentDirection === 'right') {
        currentX += horizontalDistance;
      } else {
        currentX -= horizontalDistance;
      }
      
      if (verticalDirection === 'down') {
        currentY += verticalDistance;
      } else {
        currentY -= verticalDistance;
      }
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementWidth = animationSize.width;
      const elementHeight = animationSize.height;
      
      // НОВАЯ ПРОВЕРКА: Если достигли низа и включен перезапуск
      if (config.movement.restartOnBottom && isAtBottom() && !isRestarting) {
        restartAnimation();
        return; // Прекращаем обновление позиции
      }
      
      const wasTeleported = checkAndTeleportIfNeeded(currentY, viewportHeight, elementHeight);
      
      if (!wasTeleported) {
        const shouldBounceHorizontally = shouldBounceHorizontal(currentX, viewportWidth, elementWidth);
        const shouldBounceVertically = shouldBounceVertical(currentY, viewportHeight, elementHeight);
        
        if (shouldBounceHorizontally && 
            !isFlipping && 
            (timestamp - lastFlipTime) > flipCooldown) {
          
          startFlip();
          
          if (currentDirection === 'right') {
            currentX = Math.max(currentX, 0);
          } else {
            currentX = Math.min(currentX, viewportWidth - elementWidth);
          }
        }
        
        if (shouldBounceVertically && (timestamp - lastFlipTime) > flipCooldown) {
          switchVerticalDirection();
          
          const edgeMargin = config.movement.edgeMargin || 0;
          if (verticalDirection === 'down') {
            currentY = Math.max(currentY, edgeMargin);
          } else {
            currentY = Math.min(currentY, viewportHeight - elementHeight - edgeMargin);
          }
        }
      }
      
      if (!wasTeleported && !isRestarting) {
        currentX = Math.max(0, Math.min(currentX, viewportWidth - elementWidth));
        currentY = Math.max(0, Math.min(currentY, viewportHeight - elementHeight));
      }
      
      mainContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
      
      if (snowContainer && snowTrailsVisible) {      
        const snowX = currentX;
        const snowY = currentY;
        snowContainer.style.transform = `translate(${snowX}px, ${snowY}px) scaleX(${scaleX})`;
      }
    }
    
    function checkAnimationCompletion() {
      if (animationCompleted || !config.movement.oneTime) return false;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementWidth = animationSize.width;
      const elementHeight = animationSize.height;
      
      const isOutOfBounds = 
        currentX + elementWidth < 0 ||
        currentX > viewportWidth ||
        currentY + elementHeight < 0 ||
        currentY > viewportHeight;
      
      if (isOutOfBounds) {
        animationCompleted = true;
        
        if (snowContainer && snowTrailsVisible) {
          hideSnowTrails();
        }
        
        mainContainer.style.transition = 'opacity 0.8s ease-out';
        mainContainer.style.opacity = '0';
        
        setTimeout(() => {
          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }
        }, 1000);
        
        return true;
      }
      
      return false;
    }
    
    // Функция анимации движения (запускается только после задержки)
    function startMovement() {
      animationId = requestAnimationFrame(animate);
    }
    
    function animate(timestamp) {
      if (isPaused || animationCompleted || isRestarting) {
        if (!animationCompleted && !isRestarting) {
          animationId = requestAnimationFrame(animate);
        }
        return;
      }
      
      if (isFlipping) {
        const stillFlipping = updateFlip(timestamp);
        if (stillFlipping) {
          updatePosition(timestamp);
          animationId = requestAnimationFrame(animate);
          return;
        }
      }
      
      updatePosition(timestamp);
      
      checkAnimationCompletion();
      
      if (!animationCompleted && !isRestarting) {
        animationId = requestAnimationFrame(animate);
      }
    }
    
    // ЗАПУСКАЕМ АНИМАЦИЮ С ЗАДЕРЖКОЙ (только при первом проигрывании)
    // Этот код должен работать только при первом проигрывании
    if (isFirstPlay) {
      startMovement();
    }
    
    if (config.movement.pauseOnHover) {
      mainContainer.addEventListener('mouseenter', () => {
        isPaused = true;
        mainContainer.style.filter = 'brightness(0.8) saturate(0.8)';
        mainContainer.style.transition = 'filter 0.3s';
        
        if (snowContainer && snowTrailsVisible) {
          hideSnowTrails();
        }
      });
      
      mainContainer.addEventListener('mouseleave', () => {
        isPaused = false;
        mainContainer.style.filter = 'brightness(1) saturate(1)';
        
        if (movementStarted && !snowTrailsVisible && !snowTrailsShown) {
          showSnowTrails();
        }
      });
    }
    
    // window.addEventListener('resize', () => {
    //   if (animationCompleted) return;
      
    //   // Отменяем таймер перезапуска при ресайзе
    //   if (restartTimeoutId) {
    //     clearTimeout(restartTimeoutId);
    //     restartTimeoutId = null;
    //   }
      
    //   // Отменяем текущую анимацию
    //   if (animationId) {
    //     cancelAnimationFrame(animationId);
    //     animationId = null;
    //   }
      
    //   // ПЕРЕОПРЕДЕЛЯЕМ РАЗМЕРЫ ПРИ ИЗМЕНЕНИИ ОКНА
    //   const newAnimationSize = getAnimationSize();
    //   const newSnowTrailsSize = getSnowTrailsSize();
    //   const newMovementSpeeds = getMovementSpeeds();
      
    //   // Обновляем размеры контейнеров
    //   mainContainer.style.width = `${newAnimationSize.width}px`;
    //   mainContainer.style.height = `${newAnimationSize.height}px`;
      
    //   if (snowContainer) {
    //     snowContainer.style.width = `${newSnowTrailsSize.width}px`;
    //     snowContainer.style.height = `${newSnowTrailsSize.height}px`;
    //   }
      
    //   // Обновляем скорости
    //   horizontalSpeed = newMovementSpeeds.horizontalSpeed;
    //   verticalSpeed = newMovementSpeeds.verticalSpeed;
    
      
    //   // Сбрасываем флаг перезапуска
    //   isRestarting = false;
      
    //   // Перезапускаем движение с текущей позиции
    //   lastTimestamp = null;
    //   animationId = requestAnimationFrame(animate);
    // });

    // В начало startMovementAnimation добавь:
let currentWindowWidth = window.innerWidth;

// Обновленный обработчик
window.addEventListener('resize', () => {
  if (animationCompleted) return;

  const newWidth = window.innerWidth;

  // Если ширина не изменилась — выходим (игнорируем изменение высоты)
  if (newWidth === currentWindowWidth) return;

  // Если ширина изменилась, обновляем эталонное значение
  currentWindowWidth = newWidth;

  // Отменяем таймер перезапуска
  if (restartTimeoutId) {
    clearTimeout(restartTimeoutId);
    restartTimeoutId = null;
  }

  // Обновляем параметры размеров и скоростей
  const newAnimationSize = getAnimationSize();
  const newSnowTrailsSize = getSnowTrailsSize();
  const newMovementSpeeds = getMovementSpeeds();

  // Обновляем стили контейнеров
  mainContainer.style.width = `${newAnimationSize.width}px`;
  mainContainer.style.height = `${newAnimationSize.height}px`;

  if (snowContainer) {
    snowContainer.style.width = `${newSnowTrailsSize.width}px`;
    snowContainer.style.height = `${newSnowTrailsSize.height}px`;
  }

  // Обновляем переменные скоростей (убедись, что они объявлены через let, а не const)
  horizontalSpeed = newMovementSpeeds.horizontalSpeed;
  verticalSpeed = newMovementSpeeds.verticalSpeed;

  // Сбрасываем флаг перезапуска, если он висел
  isRestarting = false;

  // Перезапускаем цикл анимации
  if (animationId) cancelAnimationFrame(animationId);
  lastTimestamp = null;
  animationId = requestAnimationFrame(animate);
});
  }
});