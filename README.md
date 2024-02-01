
# 3D Model Viewer (Beta)
브라우저에서 3D model viewer입니다. 현재 Beta 버전으로 심플한 기능 위주로 구현되어있습니다.

## Demo
https://threejs-model-viewer-kappa.vercel.app/

## Support Format
glb, obj, fbx 형식의 파일을 지원합니다.

## GUI
- 광원의 강도, 색상, 방향, 위치를 조절 할 수 있습니다.(Rotate 지원 예정)
- 모델의 채도, 색상, 반사, 광택을 사용자가 조절할 수 있습니다.
- 모델의 위치, 회전, 크기를 사용자가 조절할 수 있습니다.
    - W: 위치
    - E: 회전
    - R: 크기
    - X: X축 숨기기/보이기
    - Y: Y축 숨기기/보이기
    - Z: Z축 숨기기/보이기
## 후처리
bloomPass 적용되었습니다.

## 추후 기능 추가사항
- gltf 형식 지원
- 저장 기능
- 링크 공유 기능
- 반사, 굴절 기능
- 후처리 메뉴
- 커스텀 쉐이더 추가
- 변형 핸들러 보이기/감추기  


## Install
```shell
# step 1
git clone https://github.com/daiboom/threejs-model-viewer.git

# step 2
yarn && yarn dev

# response
VITE v5.0.12  ready in 498 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```