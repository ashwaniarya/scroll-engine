export interface StageElements {
  spacer: HTMLElement
  stage: HTMLElement
}

export function createStage(parent: HTMLElement = document.body): StageElements {
  const spacer = document.createElement('div')
  spacer.id = 'scroll-spacer'
  spacer.style.width = '100%'
  const stage = document.createElement('div')
  stage.id = 'layer-stage'
  stage.style.position = 'fixed'
  stage.style.inset = '0'
  stage.style.pointerEvents = 'none'
  parent.append(spacer, stage)
  return { spacer, stage }
}
