// cg_janitor — 1층 동쪽 복도 '정숙' 팻말 앞, 야간 수위 첫 등장 → 추격 시작.
// 1인칭 시점, 길고 아주 어두운 복도(테라조 바닥). 수위가 복도 끝에서 이미 꽤 가까이 다가와 그림 세로 가운데 55~60%를 채운다.
// 오른 다리를 뻣뻣하게 끌며 절뚝이고, 오른손 손전등을 정면(보는 사람)으로 겨눠 따뜻한 흰빛이 눈부시게 번진다.
// 왼손의 알루미늄 배트는 바닥에 닿을 듯 낮게 늘어뜨림. 허리띠의 열쇠 꾸러미·호루라기.
// 앞쪽 왼벽: 글자 없는 흰 팻말(검은 테). 어둠 속: 닫힌 사무실 문, 바닥의 빨간 공구함, 내려진 방화 셔터, 낡은 나무 두짝문,
// 복도 끝의 초록 비상구 빛과 자판기의 흐린 붉은빛. 으스스하지만 잔인하지 않게.
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#120e0c';
const DK = '#04050a';

// ---------------------------------------------------------------- 한 점 투시
const FL = 900, VX = 640, VY = 495, EYE = 1.5;
const pr = (x, y, z) => [VX + FL * x / z, VY - FL * (y - EYE) / z];
const XL = -1.55, XR = 1.25, CH = 3.0, ZEND = 34;
const quadW = (x, y0, y1, z0, z1) => poly([pr(x, y0, z0), pr(x, y0, z1), pr(x, y1, z1), pr(x, y1, z0)]); // 옆벽 위 사각형
const quadF = (x0, x1, z0, z1, y = 0) => poly([pr(x0, y, z0), pr(x1, y, z0), pr(x1, y, z1), pr(x0, y, z1)]); // 바닥·천장 위 사각형

// ---------------------------------------------------------------- 수위 색
const C = {
  skin: { base: '#8a634e', lit: '#cf9a70', shade: '#47302a', line: '#1f120d' },
  hair: { base: '#8a8780', shade: '#55534e', line: '#232220' },
  shirt: { base: '#3d4433', shade: '#252a1e', lit: '#666b49', dark: '#2f3528', line: '#0c0e09' },
  pants: { base: '#353b2c', shade: '#1f2319', lit: '#585c40', line: '#0b0c09' },
  rim: '#9fbde6',
};

// 가운데가 굵고 양끝이 가는 선(빛줄기)
function ray(cx, cy, ang, len, w) {
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  return poly([[cx - dx * len, cy - dy * len], [cx + nx * w, cy + ny * w], [cx + dx * len, cy + dy * len], [cx - nx * w, cy - ny * w]]);
}

// ---------------------------------------------------------------- 수위
function guard() {
  let s = '';
  const sk = C.skin, sh = C.shirt, pa = C.pants;

  // ---- 다리: 그림 왼쪽 = 그의 오른 다리(뻣뻣하게 뒤로 끌림), 그림 오른쪽 = 왼 다리(체중을 실어 앞으로)
  // 끌리는 다리: 곧고 조금 뒤(작게), 구두 앞코만 바닥에
  s += P('M332 1258 C350 1250 380 1246 404 1250 L430 1180 C400 1180 360 1200 340 1230 Z', '#000', 'none', 0, 'opacity="0.35" filter="url(#jnB6)"'); // 끌린 자국
  s += P('M366 958 C358 1040 348 1150 344 1234 L408 1242 C420 1160 444 1080 476 1040 Z', pa.base, pa.line, 3.5);
  s += P('M430 1060 C426 1120 416 1190 408 1242 L386 1240 C394 1180 404 1110 410 1060 Z', pa.shade, 'none', 0, 'opacity="0.8"');
  s += P('M360 1120 C372 1126 388 1126 402 1120 M356 1180 C368 1186 384 1186 396 1180', 'none', pa.line, 2.2, 'opacity="0.6"');
  s += P('M346 1232 C340 1246 344 1260 358 1264 C376 1268 396 1264 406 1256 C410 1248 410 1240 408 1236 Z', '#0c0c0e', INK, 3);
  s += P('M352 1256 C366 1261 386 1261 400 1254', 'none', '#4a5368', 2.5, 'opacity="0.7"');
  // 디딤 다리: 무릎이 조금 굽고 구두가 앞으로(크게)
  s += P('M488 1040 C504 1090 520 1140 526 1196 C530 1232 532 1258 534 1280 L612 1282 C614 1240 618 1180 616 1120 C614 1060 604 1000 596 958 Z', pa.base, pa.line, 3.5);
  s += P('M596 1000 C606 1060 612 1120 612 1190 C612 1230 610 1260 610 1282 L586 1282 C590 1230 594 1170 592 1110 C590 1060 586 1020 580 990 Z', pa.shade, 'none', 0, 'opacity="0.85"');
  s += P('M526 1150 C540 1158 556 1160 572 1156', 'none', pa.line, 2.5, 'opacity="0.7"'); // 무릎 주름
  s += P('M534 1196 C548 1200 566 1200 584 1194 M520 1110 C530 1100 536 1086 538 1070', 'none', pa.line, 2.2, 'opacity="0.6"');
  s += P('M524 1272 C514 1284 512 1300 520 1310 C540 1320 590 1322 616 1314 C626 1306 624 1290 614 1276 Z', '#0b0b0d', INK, 3);
  s += P('M524 1300 C546 1310 588 1312 614 1304', 'none', '#56617a', 2.5, 'opacity="0.7"');
  s += P('M532 1284 C548 1280 566 1280 582 1284', 'none', '#2a2c33', 2);

  // ---- 상체는 성한 다리(그림 오른쪽) 쪽으로 조금 기울어짐
  s += '<g transform="rotate(2.5 480 1000)">';
  // ---- 몸통(셔츠, 배가 조금 나온 다부진 체격)
  const torso = 'M432 552 C404 558 370 566 346 584 C334 600 340 640 350 680 C356 760 356 850 360 930 L594 934 C596 860 594 770 592 700 C600 650 604 612 598 598 C574 572 534 560 504 554 Z';
  s += P(torso, sh.base, sh.line, 3.5);
  // 손전등 빛을 받은 왼쪽 아래 / 그늘진 오른쪽
  s += P('M352 760 C356 840 358 890 360 930 L430 932 C410 880 392 820 380 760 Z', sh.lit, 'none', 0, 'opacity="0.55"');
  s += P('M592 700 C594 770 596 860 594 934 L548 934 C560 860 566 780 566 700 C568 660 574 630 586 610 Z', sh.shade, 'none', 0, 'opacity="0.85"');
  // 단추줄·단추
  s += P('M470 572 C472 690 474 810 474 932', 'none', sh.line, 3);
  for (const y of [640, 720, 800, 880]) s += `<circle cx="${f1(470 + (y - 572) * 0.012)}" cy="${y}" r="4.5" fill="#2a2e22" stroke="${sh.line}" stroke-width="1.8"/>`;
  // 가슴 주머니 두 개(덮개는 더 짙은 올리브)
  for (const [x0, x1, y0] of [[392, 452, 660], [492, 552, 664]]) {
    s += P(`M${x0} ${y0} L${x1} ${y0} L${x1 + 1} ${y0 + 66} L${x0 - 1} ${y0 + 66} Z`, 'none', sh.line, 2.5, 'opacity="0.85"');
    s += P(`M${x0 - 3} ${y0 - 2} L${x1 + 3} ${y0 - 2} L${x1 + 3} ${y0 + 16} L${(x0 + x1) / 2} ${y0 + 24} L${x0 - 3} ${y0 + 16} Z`, sh.dark, sh.line, 2.5);
    s += `<circle cx="${(x0 + x1) / 2}" cy="${y0 + 16}" r="3.5" fill="#262a1e" stroke="${sh.line}" stroke-width="1.5"/>`;
  }
  // 작은 금색 배지(왼가슴 = 그림 오른쪽 주머니 위)
  s += P('M522 626 L534 620 L546 626 L544 642 L534 650 L524 642 Z', '#c4a24a', '#4a3810', 2.2);
  s += P('M527 628 L534 624 L541 628 L540 638 L534 643 L528 638 Z', 'none', '#6e5418', 1.6) + `<circle cx="534" cy="632" r="2.6" fill="#f0d98a"/>`;
  // 허리띠 위로 접혀 불룩한 셔츠 주름
  s += P('M372 902 C392 914 414 918 438 912 M500 914 C522 920 550 916 574 902 M396 880 C410 890 424 894 436 890', 'none', sh.line, 2.4, 'opacity="0.75"');
  s += P('M362 900 C380 914 410 922 440 918 L440 926 C410 928 380 924 360 918 Z', sh.shade, 'none', 0, 'opacity="0.6"');
  // 허리띠 + 놋쇠 버클
  s += P('M358 922 C420 928 530 930 596 924 L596 954 C530 960 420 958 360 952 Z', '#151515', INK, 3);
  s += P('M358 926 C420 932 530 934 596 928', 'none', '#3c4250', 2, 'opacity="0.6"');
  s += `<rect x="456" y="922" width="40" height="34" rx="4" fill="#a8843a" stroke="#3e2c0c" stroke-width="2.5"/><rect x="465" y="930" width="22" height="18" rx="2" fill="#151515"/>`;
  // 바지 윗부분(허리)
  s += P('M360 952 C420 958 530 960 596 954 L596 990 C580 1010 540 1030 488 1042 C450 1030 400 1000 366 980 Z', pa.base, pa.line, 3);
  s += P('M478 958 L484 1040', 'none', pa.line, 2.5, 'opacity="0.7"');
  // 호루라기(그림 왼쪽 허리, 짧은 끈) · 열쇠 꾸러미(그림 오른쪽 허리)
  s += P('M402 956 C398 972 396 986 400 998', 'none', '#202020', 2.5);
  s += P('M386 998 L400 998 C410 996 418 1002 418 1011 C418 1020 410 1024 402 1023 C396 1022 392 1018 391 1012 L386 1012 Z', '#b9bcc0', '#2b2d30', 2.2) + `<circle cx="405" cy="1010" r="3" fill="#2b2d30"/>` + P('M389 1002 L398 1002', 'none', '#f1f3f5', 2, 'opacity="0.8"');
  s += `<circle cx="566" cy="984" r="15" fill="none" stroke="#aeb2b6" stroke-width="4"/><circle cx="566" cy="984" r="15" fill="none" stroke="#2a2c2f" stroke-width="1.5" opacity="0.6"/>`;
  s += P('M558 996 L552 1028 L558 1030 L562 1002 Z M568 999 L574 1034 L580 1032 L574 998 Z M576 994 L590 1022 L595 1018 L582 992 Z', '#c9cdd1', '#2a2c2f', 2);
  s += P('M552 1028 l-4 6 l6 2 M574 1034 l-2 6 l6 0 M590 1022 l1 6 l5 -3', 'none', '#c9cdd1', 2.5);

  // ---- 목 · 깃
  s += P('M434 520 C434 536 432 552 428 568 L510 568 C506 552 504 536 504 520 Z', sk.base, sk.line, 3.5);
  s += P('M438 526 C450 540 488 542 502 526 L504 552 C484 558 456 558 434 552 Z', sk.shade, 'none', 0, 'opacity="0.7"');
  s += P('M430 560 L452 612 L470 576 Z', sh.base, sh.line, 3) + P('M508 560 L488 614 L470 576 Z', sh.base, sh.line, 3);
  s += P('M430 560 C438 556 448 554 456 554 L470 576 Z M508 560 C500 556 490 554 482 554 L470 576 Z', '#2c2a24', 'none', 0, 'opacity="0.6"');
  // 견장(짙은 올리브)
  s += P('M440 566 L352 590 L356 606 L444 584 Z', sh.dark, sh.line, 2.5) + `<circle cx="364" cy="596" r="3.5" fill="#262a1e"/>`;
  s += P('M498 566 L592 598 L588 614 L494 584 Z', sh.dark, sh.line, 2.5) + `<circle cx="580" cy="604" r="3.5" fill="#262a1e"/>`;

  // ---- 그림 오른쪽 팔(그의 왼팔): 아래로 늘어뜨려 배트를 쥠
  s += P('M584 596 C606 604 624 630 630 680 C636 730 642 790 642 850 L606 856 C604 800 598 750 592 700 Z', sh.base, sh.line, 3.5);
  s += P('M630 680 C636 730 642 790 642 850 L626 852 C624 800 620 740 612 690 Z', sh.shade, 'none', 0, 'opacity="0.85"');
  s += P('M600 640 L626 634 L630 664 L614 676 L600 664 Z', '#232c4e', '#0b0f20', 2.2); // 남색 어깨 패치
  s += P('M606 764 C616 770 628 770 636 762 M608 786 C618 794 630 794 638 786', 'none', sh.line, 2.2, 'opacity="0.8"'); // 팔꿈치 주름
  s += P('M606 846 L644 840 L646 868 L606 874 Z', sh.dark, sh.line, 2.5); // 소맷부리
  // 배트(알루미늄, 손잡이 검정) — 손 위로 손잡이 끝 마개, 아래로 몸통이 굵어지며 바닥 가까이
  s += P('M622 872 L640 870 L643 884 L620 886 Z', '#1a1a1c', INK, 2.5); // 마개
  s += P('M626 884 L640 882 L652 960 L638 962 Z', '#1d1d20', INK, 2.5); // 검은 그립
  s += P('M638 960 L652 958 C668 1060 690 1180 708 1282 C710 1296 700 1304 690 1302 C680 1300 676 1292 674 1282 C664 1180 650 1060 638 960 Z', '#a7adb4', '#24272b', 3);
  s += P('M646 970 C658 1060 676 1170 694 1280', 'none', '#eef2f6', 4, 'opacity="0.85"');
  s += P('M652 966 C668 1060 688 1180 704 1286', 'none', '#5d636b', 3, 'opacity="0.8"');
  s += `<ellipse cx="691" cy="1300" rx="16" ry="6" fill="#000" opacity="0.5"/>`;
  // 주먹(배트 손잡이를 쥠)
  s += P('M606 870 C602 890 606 912 616 924 C628 932 646 930 654 918 C660 904 658 884 650 870 C640 864 618 864 606 870 Z', sk.base, sk.line, 3);
  s += P('M616 888 C626 886 640 886 652 890 M614 902 C626 900 640 900 654 904 M618 914 C628 914 640 914 650 916', 'none', sk.line, 2, 'opacity="0.7"');
  s += P('M640 872 C650 876 656 888 656 904 C656 916 652 924 644 928 C650 912 650 890 640 872 Z', sk.shade, 'none', 0, 'opacity="0.8"');

  // ---- 그림 왼쪽 팔(그의 오른팔): 손전등을 앞으로 겨눔(팔뚝이 보는 쪽으로 다가옴)
  s += P('M348 588 C326 600 312 640 308 700 C304 740 304 772 310 790 L362 800 C364 770 366 730 366 690 C362 650 358 620 348 588 Z', sh.base, sh.line, 3.5);
  s += P('M308 700 C304 740 304 772 310 790 L330 794 C328 760 328 720 334 680 Z', sh.lit, 'none', 0, 'opacity="0.6"');
  s += P('M314 748 C326 756 342 758 358 752 M318 768 C330 774 346 774 360 768', 'none', sh.line, 2.2, 'opacity="0.8"');
  // 팔뚝(앞으로, 짧게 보임) + 소맷부리
  s += P('M306 780 C300 800 304 826 320 842 L374 836 C380 816 378 796 366 782 Z', sh.base, sh.line, 3.5);
  s += P('M306 780 C300 800 304 826 320 842 L338 840 C326 820 322 800 326 782 Z', sh.lit, 'none', 0, 'opacity="0.65"');
  s += P('M314 830 L376 822 L380 852 L318 862 Z', sh.dark, sh.line, 2.5);
  // 손(손전등 몸통을 감싼 주먹, 손전등 머리가 앞을 가림)
  s += P('M318 858 C312 876 318 898 334 906 C352 912 376 906 388 892 C394 878 390 860 380 852 Z', sk.lit, sk.line, 3);
  s += P('M330 880 C344 882 360 880 374 874 M326 894 C340 896 356 894 370 888', 'none', sk.line, 2, 'opacity="0.6"');
  s += '</g>';
  return s;
}

// 머리(얼굴은 손전등 빛을 아래에서 받아 코 아래가 밝고 이마·눈두덩은 그늘, 정수리는 뒤쪽의 차가운 빛으로 테두리)
const FACE = 'M414 468 C411 428 434 397 469 396 C505 397 528 428 525 468 C525 488 523 504 519 516 C514 532 498 546 482 550 C474 552 464 552 456 550 C440 546 424 532 419 516 C415 504 414 488 414 468 Z';
function head() {
  const sk = C.skin, hr = C.hair;
  let s = '';
  // 옆·뒤의 짧은 회색 머리띠(두상 밖으로 살짝 부풀게)
  s += P('M420 440 C408 450 404 468 405 488 C406 502 410 512 418 518 L424 518 L424 440 Z', hr.base, hr.line, 3);
  s += P('M518 440 C530 450 534 468 533 488 C532 502 528 512 520 518 L514 518 L514 440 Z', hr.shade, hr.line, 3);
  s += P('M409 456 l7 3 M406 472 l8 1 M407 488 l8 0 M410 503 l7 -1 M529 456 l-7 3 M532 472 l-8 1 M531 488 l-8 0 M528 503 l-7 -1', 'none', hr.line, 1.6, 'opacity="0.7"');
  // 귀(작게)
  s += P('M412 474 C402 470 398 486 401 498 C404 508 412 510 416 504 Z', sk.shade, sk.line, 3);
  s += P('M526 474 C536 470 540 486 537 498 C534 508 526 510 522 504 Z', sk.shade, sk.line, 3);
  // 얼굴: 밝은 아래쪽(기본색) 위에 그늘을 덮음
  s += P(FACE, sk.lit, sk.line, 3.5);
  s += `<clipPath id="jnFaceClip"><path d="${FACE}"/></clipPath><g clip-path="url(#jnFaceClip)">`;
  // 코 높이 위는 그늘(아래에서 비춘 빛), 콧날·광대 아래 경계는 약간 물결
  s += P('M400 380 L540 380 L540 494 C526 500 512 496 500 504 C490 510 480 500 469 504 C458 500 448 510 438 504 C426 496 412 500 400 494 Z', sk.base, 'none');
  s += P('M400 380 L540 380 L540 470 C522 462 500 460 469 462 C438 460 418 462 400 470 Z', sk.shade, 'none', 0, 'opacity="0.85"');
  // 눈두덩 그늘(깊게)
  s += P('M424 470 C432 458 456 456 466 468 C462 488 434 492 424 470 Z M472 468 C482 456 506 458 514 470 C504 492 476 488 472 468 Z', '#2a1a13', 'none', 0, 'opacity="0.75"');
  // 오른쪽 볼 그늘(빛 반대쪽)
  s += P('M512 470 C522 492 520 520 500 548 L540 560 L540 460 Z', sk.shade, 'none', 0, 'opacity="0.55"');
  // 턱 아래 밝은 반사
  s += P('M440 536 C452 546 486 546 498 536 C490 548 478 552 469 552 C458 552 448 548 440 536 Z', '#e6b48a', 'none', 0, 'opacity="0.8"');
  s += '</g>';
  s += P(FACE, 'none', sk.line, 3.5);
  // 이마 주름(깊게)
  s += P('M442 424 C456 419 482 419 496 424 M438 435 C455 430 483 430 500 435 M444 445 C458 442 480 442 494 445', 'none', '#1c110c', 2.4, 'opacity="0.8"');
  // 정수리 테두리 빛(뒤쪽의 차가운 빛)
  s += P('M426 428 C438 407 453 400 469 400 C487 400 502 408 513 426', 'none', C.rim, 3.5, 'opacity="0.7"');
  // 숱 많은 회색 눈썹: 낮고 무겁게, 바깥쪽이 처짐, 윗가장자리는 털끝처럼 들쭉날쭉
  const browL = 'M464 472 L462 463 L456 458 L451 461 L446 456 L441 460 L436 458 L432 462 L427 462 L424 469 C432 466 448 467 464 472 Z';
  const browR = 'M474 472 L476 463 L482 458 L487 461 L492 456 L497 460 L502 458 L506 462 L511 462 L514 469 C506 466 490 467 474 472 Z';
  s += P(browL + ' ' + browR, hr.base, hr.line, 2.4);
  s += P('M430 466 l4 -5 M438 465 l4 -6 M446 465 l3 -6 M455 467 l2 -5 M508 466 l-4 -5 M500 465 l-4 -6 M492 465 l-3 -6 M483 467 l-2 -5', 'none', hr.shade, 1.6);
  // 가늘고 처진 눈: 무거운 윗눈꺼풀이 흐린 눈동자 위를 덮은 반쯤 감긴 멍한 시선(동공 없음)
  const eyeL = 'M462 479 C456 474 444 474 436 482 C443 486 456 486 462 479 Z';
  const eyeR = 'M476 479 C482 474 494 474 502 482 C495 486 482 486 476 479 Z';
  s += `<clipPath id="jnEyes"><path d="${eyeL} ${eyeR}"/></clipPath>`;
  s += P(eyeL + ' ' + eyeR, '#c4c6ba', 'none');
  s += `<g clip-path="url(#jnEyes)"><circle cx="450" cy="481" r="4.2" fill="#8a8d85"/><circle cx="488" cy="481" r="4.2" fill="#8a8d85"/>` +
    P('M430 470 L510 470 L510 478.5 C496 476 482 476 470 479 C458 476 444 476 430 478.5 Z', '#6f6a62', 'none', 0, 'opacity="0.55"') + '</g>';
  s += P('M463 479 C456 472 443 472 433 483', 'none', '#140b07', 4) + P('M475 479 C482 472 495 472 505 483', 'none', '#140b07', 4);
  s += P('M462 473 C454 468 442 469 433 476 M476 473 C484 468 496 469 505 476', 'none', '#140b07', 1.8, 'opacity="0.7"'); // 처진 눈꺼풀 주름
  s += P('M438 485 C446 488 456 487 461 482 M477 482 C482 487 492 488 500 485', 'none', sk.line, 1.6, 'opacity="0.65"');
  s += P('M440 492 C448 496 456 495 460 491 M478 491 C482 495 490 496 498 492', 'none', sk.line, 1.5, 'opacity="0.5"'); // 눈밑 주름
  // 코(넓고 큼직한 콧방울)
  s += P('M466 482 C465 494 462 504 458 510 C462 515 476 515 480 510 C476 504 473 494 472 482', 'none', sk.line, 2.6);
  s += P('M458 510 C462 506 466 507 468 511 M480 510 C476 506 472 507 470 511', 'none', sk.line, 2);
  // 팔자 주름 · 처진 볼
  s += P('M456 506 C446 514 440 524 438 536 M482 506 C492 514 498 524 500 536', 'none', sk.line, 2.2, 'opacity="0.85"');
  s += P('M422 508 C426 522 430 532 436 540 M516 508 C512 522 508 532 502 540', 'none', sk.line, 1.8, 'opacity="0.6"');
  // 숱 많은 회색 콧수염(윗입술을 덮고 아랫단은 털끝처럼 들쭉날쭉, 끝이 처짐) + 다문 입
  const mus = 'M469 514 C460 512 448 514 442 520 C438 526 437 532 438 538 L442 534 L445 538 L449 533 L453 537 L457 532 L461 536 L465 531 L469 535 L473 531 L477 536 L481 532 L485 537 L489 533 L493 538 L496 534 L500 538 C501 532 500 526 496 520 C490 514 478 512 469 514 Z';
  s += P(mus, hr.base, hr.line, 2.4);
  s += P('M448 519 C450 525 452 530 452 534 M456 516 C458 522 459 528 459 532 M464 515 C465 521 465 527 465 531 M474 515 C473 521 473 527 473 531 M482 516 C480 522 479 528 479 532 M490 519 C488 525 486 530 486 534', 'none', hr.shade, 1.6);
  s += P('M446 518 C454 515 462 514 468 516', 'none', '#c9c6be', 2, 'opacity="0.6"');
  s += P('M452 543 C460 540 478 540 486 543', 'none', '#1c110c', 2.6);
  s += P('M448 545 l4 -2 M490 545 l-4 -2', 'none', '#1c110c', 2);
  return s;
}

// ---------------------------------------------------------------- 그리기
export function draw() {
  const LX = 346, LY = 868; // 손전등 렌즈(보는 사람 쪽을 향함)
  const defs =
    `<linearGradient id="jnFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11141a"/><stop offset="1" stop-color="#07080a"/></linearGradient>` +
    `<linearGradient id="jnCeil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030406"/><stop offset="1" stop-color="#0b0d12"/></linearGradient>` +
    `<radialGradient id="jnEnd" cx="${VX}" cy="${VY}" r="340" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3e5a6a" stop-opacity="0.65"/><stop offset="0.25" stop-color="#22323f" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="jnGlare" cx="${LX}" cy="${LY}" r="600" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6e2" stop-opacity="0.95"/><stop offset="0.06" stop-color="#ffe7bd" stop-opacity="0.7"/><stop offset="0.2" stop-color="#e2b479" stop-opacity="0.28"/><stop offset="0.5" stop-color="#7a5531" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="jnPool" cx="${LX + 40}" cy="1420" r="520" gradientUnits="userSpaceOnUse" gradientTransform="translate(${LX + 40} 1420) scale(1 0.35) translate(${-(LX + 40)} -1420)"><stop offset="0" stop-color="#e9c48e" stop-opacity="0.32"/><stop offset="0.5" stop-color="#8a6438" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="jnVig" cx="${VX - 120}" cy="760" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient>` +
    `<linearGradient id="jnBot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/></linearGradient>` +
    `<linearGradient id="jnFaceLight" gradientUnits="userSpaceOnUse" x1="0" y1="560" x2="0" y2="400"><stop offset="0" stop-color="#ffcf94" stop-opacity="0.35"/><stop offset="1" stop-color="#ffcf94" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="jnShade" cx="${LX}" cy="${LY}" r="620" gradientUnits="userSpaceOnUse"><stop offset="0.12" stop-color="#05060a" stop-opacity="0"/><stop offset="0.5" stop-color="#05060a" stop-opacity="0.38"/><stop offset="1" stop-color="#05060a" stop-opacity="0.62"/></radialGradient>` +
    `<filter id="jnB40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>` +
    `<filter id="jnB14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>` +
    `<filter id="jnB6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="jnB3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>`;

  let s = `<rect width="1024" height="1536" fill="#06070a"/>`;
  // ---------------- 복도 면
  const zn = 0.5;
  s += P(poly([pr(XL, CH, zn), pr(XR, CH, zn), pr(XR, CH, ZEND), pr(XL, CH, ZEND)]), 'url(#jnCeil)', DK, 2.5);
  s += P(poly([pr(XL, 0, zn), pr(XL, CH, zn), pr(XL, CH, ZEND), pr(XL, 0, ZEND)]), '#0d1016', DK, 2.5);
  s += P(poly([pr(XR, 0, zn), pr(XR, CH, zn), pr(XR, CH, ZEND), pr(XR, 0, ZEND)]), '#0b0e13', DK, 2.5);
  s += P(poly([pr(XL, 0, zn), pr(XR, 0, zn), pr(XR, 0, ZEND), pr(XL, 0, ZEND)]), 'url(#jnFloor)', DK, 2.5);
  s += P(poly([pr(XL, 0, ZEND), pr(XR, 0, ZEND), pr(XR, CH, ZEND), pr(XL, CH, ZEND)]), '#10161b', DK, 2);
  // 허리벽 경계선 · 걸레받이
  s += P(`M${pt(pr(XL, 1.1, zn))} L${pt(pr(XL, 1.1, ZEND))} M${pt(pr(XR, 1.1, zn))} L${pt(pr(XR, 1.1, ZEND))}`, 'none', '#1c222b', 3);
  s += P(poly([pr(XL, 0, zn), pr(XL, 0.12, zn), pr(XL, 0.12, ZEND), pr(XL, 0, ZEND)]) + ' ' + poly([pr(XR, 0, zn), pr(XR, 0.12, zn), pr(XR, 0.12, ZEND), pr(XR, 0, ZEND)]), '#07080b');
  // 바닥 판 이음(성기게)
  let fl = '';
  for (const z of [2.2, 3.1, 4.4, 6.4, 9.6, 15]) fl += `M${pt(pr(XL, 0, z))} L${pt(pr(XR, 0, z))} `;
  fl += `M${pt(pr(-0.15, 0, zn))} L${pt(pr(-0.15, 0, ZEND))}`;
  s += P(fl, 'none', '#1a1e25', 2.5, 'opacity="0.8"');
  // 테라조 돌 알갱이(드문드문, 결정적 난수)
  let q = 19, chips = '';
  const rnd = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
  for (let i = 0; i < 170; i++) {
    const x = XL + rnd() * (XR - XL), z = 1.0 + rnd() * rnd() * 14, p = pr(x, 0, z), r = 0.6 + 5 / z * rnd();
    chips += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(r * 1.7)}" ry="${f1(r * 0.6)}" fill="${rnd() < 0.5 ? '#262b33' : '#050608'}"/>`;
  }
  s += `<g opacity="0.7">${chips}</g>`;
  // 천장 형광등(꺼짐)
  for (const z of [3.2, 5.6, 9, 14, 21]) {
    s += P(quadF(-0.5, 0.2, z, z + 1.2, CH), '#14171d', DK, 2);
    s += P(`M${pt(pr(-0.15, CH - 0.01, z + 0.05))} L${pt(pr(-0.15, CH - 0.01, z + 1.15))}`, 'none', '#2a313c', 3, 'opacity="0.8"');
  }

  // ---------------- 왼벽: 닫힌 사무실 문들
  for (const [z0, z1] of [[4.2, 5.2], [10.2, 11.2], [17, 18]]) {
    s += P(quadW(XL, 0, 2.15, z0 - 0.08, z1 + 0.08), '#090b0f', DK, 2);
    s += P(quadW(XL, 0, 2.08, z0, z1), '#1a1714', DK, 2);
    s += P(quadW(XL, 1.3, 1.95, z0 + 0.15, z1 - 0.15), '#0d1117', DK, 1.6); // 위쪽 유리창
    s += P(`M${pt(pr(XL, 1.0, z1 - 0.12))} L${pt(pr(XL, 1.0, z1 - 0.2))}`, 'none', '#4b4b4b', 3);
  }
  // 바닥의 빨간 공구함(왼벽 가까이)
  const tb = (x, y, z) => pr(x, y, z);
  s += P(poly([tb(-1.45, 0, 2.95), tb(-1.07, 0, 2.95), tb(-1.07, 0.2, 2.95), tb(-1.45, 0.2, 2.95)]), '#5e1615', DK, 2.5);
  s += P(poly([tb(-1.45, 0.2, 2.95), tb(-1.07, 0.2, 2.95), tb(-1.07, 0.2, 3.18), tb(-1.45, 0.2, 3.18)]), '#7e2421', DK, 2.5);
  s += P(poly([tb(-1.07, 0, 2.95), tb(-1.07, 0, 3.18), tb(-1.07, 0.2, 3.18), tb(-1.07, 0.2, 2.95)]), '#3e0e0e', DK, 2.5);
  s += P(`M${pt(tb(-1.36, 0.2, 3.07))} L${pt(tb(-1.36, 0.26, 3.07))} L${pt(tb(-1.16, 0.26, 3.07))} L${pt(tb(-1.16, 0.2, 3.07))}`, 'none', '#202020', 3);
  s += P(`M${pt(tb(-1.45, 0.14, 2.95))} L${pt(tb(-1.07, 0.14, 2.95))}`, 'none', '#2a0707', 2);

  // ---------------- 오른벽: 낡은 나무 두짝문 · 내려진 방화 셔터(계단 입구)
  const dz0 = 5.0, dz1 = 6.7;
  s += P(quadW(XR, 0, 2.5, dz0 - 0.12, dz1 + 0.12), '#130f0d', DK, 2.5);
  s += P(quadW(XR, 0, 2.38, dz0, dz1), '#1b1512', DK, 2);
  s += P(`M${pt(pr(XR, 0, (dz0 + dz1) / 2))} L${pt(pr(XR, 2.38, (dz0 + dz1) / 2))}`, 'none', DK, 2.5);
  for (const h of [0.5, 1.9]) s += P(quadW(XR, h, h + 0.1, dz0 + 0.04, dz1 - 0.04), '#262a2e', DK, 1.6);
  const sz0 = 9.6, sz1 = 12;
  s += P(quadW(XR, 0, 2.5, sz0, sz1), '#1a1e23', DK, 2);
  let slats = '';
  for (const h of [0.4, 0.8, 1.2, 1.6, 2.0]) slats += `M${pt(pr(XR, h, sz0))} L${pt(pr(XR, h, sz1))} `;
  s += P(slats, 'none', '#0b0d10', 2);
  s += P(quadW(XR, 2.5, 2.85, sz0 - 0.1, sz1 + 0.1), '#232830', DK, 2);

  // ---------------- 복도 끝: 초록 비상구 빛 · 자판기의 흐린 붉은빛
  s += `<rect width="1024" height="1536" fill="url(#jnEnd)" style="mix-blend-mode:screen"/>`;
  const ex = pr(-0.2, 2.45, ZEND - 0.1), ex1 = pr(0.35, 2.25, ZEND - 0.1);
  s += `<rect x="${f1(ex[0] - 8)}" y="${f1(ex[1] - 8)}" width="${f1(ex1[0] - ex[0] + 16)}" height="${f1(ex1[1] - ex[1] + 16)}" fill="#45d07a" opacity="0.5" filter="url(#jnB6)"/>`;
  s += `<rect x="${f1(ex[0])}" y="${f1(ex[1])}" width="${f1(ex1[0] - ex[0])}" height="${f1(ex1[1] - ex[1])}" fill="#7ce8a2"/>`;
  s += `<ellipse cx="${f1((ex[0] + ex1[0]) / 2)}" cy="${f1(ex[1])}" rx="60" ry="40" fill="#2fa860" opacity="0.28" filter="url(#jnB14)"/>`;
  const vm0 = pr(XR - 0.65, 0, ZEND - 1.2), vm1 = pr(XR - 0.05, 1.75, ZEND - 1.2);
  s += `<rect x="${f1(vm0[0])}" y="${f1(vm1[1])}" width="${f1(vm1[0] - vm0[0])}" height="${f1(vm0[1] - vm1[1])}" fill="#7a2328" opacity="0.42"/>`;
  s += `<ellipse cx="${f1((vm0[0] + vm1[0]) / 2)}" cy="${f1((vm0[1] + vm1[1]) / 2)}" rx="54" ry="48" fill="#a52a30" opacity="0.2" filter="url(#jnB14)"/>`;
  // 바닥에 비친 끝의 빛
  s += P(`M${f1(ex[0] + 4)} ${f1(pr(0, 0, ZEND)[1] + 4)} L${f1(ex1[0] - 4)} ${f1(pr(0, 0, ZEND)[1] + 4)} L${f1(ex1[0] + 10)} ${f1(pr(0, 0, 14)[1])} L${f1(ex[0] - 10)} ${f1(pr(0, 0, 14)[1])} Z`, '#3fbf74', 'none', 0, 'opacity="0.12" filter="url(#jnB6)"');
  s += P(`M${f1(vm0[0] + 2)} ${f1(vm0[1] + 2)} L${f1(vm1[0] - 2)} ${f1(vm0[1] + 2)} L${f1(vm1[0] + 14)} ${f1(pr(0, 0, 12)[1])} L${f1(vm0[0] + 4)} ${f1(pr(0, 0, 12)[1])} Z`, '#b0353a', 'none', 0, 'opacity="0.14" filter="url(#jnB6)"');

  // ---------------- 앞쪽 왼벽: 글자 없는 흰 팻말(검은 테)
  const sg = [pr(XL, 2.12, 2.35), pr(XL, 2.12, 2.85), pr(XL, 1.84, 2.85), pr(XL, 1.84, 2.35)];
  s += P(poly(sg), '#8f908b', '#050505', 5);
  s += P(poly([pr(XL, 2.08, 2.39), pr(XL, 2.08, 2.81), pr(XL, 1.88, 2.81), pr(XL, 1.88, 2.39)]), 'none', '#181818', 3);
  s += P(poly([pr(XL - 0.0, 1.84, 2.35), pr(XL, 1.84, 2.85), pr(XL, 1.8, 2.85), pr(XL, 1.8, 2.35)]), '#000', 'none', 0, 'opacity="0.4"');

  // ---------------- 손전등 빛이 바닥·벽에 번짐(수위 앞)
  s += `<rect width="1024" height="1536" fill="url(#jnPool)" style="mix-blend-mode:screen"/>`;
  // 수위 발밑 그림자(빛이 앞에서 오니 뒤로 길게)
  s += P('M380 1268 C420 1240 600 1236 640 1270 L700 1150 C640 1120 500 1110 430 1150 Z', '#000', 'none', 0, 'opacity="0.35" filter="url(#jnB14)"');

  // ---------------- 수위(뒤쪽의 차가운 테두리 빛 → 몸 → 머리)
  const body = guard(), hd = head();
  // 테두리 빛: 몸을 살짝 오른쪽 위로 밀어 낸 실루엣을 차가운 색으로 깐 뒤 그 위에 몸을 그림
  const sil = body.replace(/fill="[^"]*"/g, `fill="${C.rim}"`).replace(/stroke="[^"]*"/g, `stroke="${C.rim}"`).replace(/opacity="[^"]*"/g, '').replace(/filter="[^"]*"/g, '');
  s += `<clipPath id="jnUpper"><rect x="0" y="0" width="1024" height="930"/></clipPath><g clip-path="url(#jnUpper)"><g transform="translate(6 -4)" opacity="0.55">${sil}</g></g>`;
  s += body;
  // 손전등에서 먼 쪽(오른쪽 위·다리)은 어둠 속으로: 몸 실루엣 마스크에 어두운 방사 그라데이션
  const mk = body.replace(/fill="[^"]*"/g, 'fill="#fff"').replace(/stroke="[^"]*"/g, 'stroke="#fff"').replace(/opacity="[^"]*"/g, '').replace(/filter="[^"]*"/g, '');
  s += `<mask id="jnBodyMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="#000"/>${mk}</mask>`;
  s += `<rect width="1024" height="1536" fill="url(#jnShade)" mask="url(#jnBodyMask)"/>`;
  // 머리: 구부정하게 조금 숙여 앞으로(목이 짧아 보이게), 상체와 같이 기울어짐
  s += `<g transform="rotate(2.5 480 1000) translate(4 12) rotate(-4 469 540)">${hd}` +
    // 얼굴 아래쪽에 닿는 따뜻한 빛(손전등 반사)
    P(FACE, 'url(#jnFaceLight)', 'none', 0, 'style="mix-blend-mode:screen"') + '</g>';

  // ---------------- 손전등 머리(렌즈가 정면) + 눈부신 빛 + 렌즈 플레어
  s += `<circle cx="${LX}" cy="${LY}" r="34" fill="#c3c8ce" stroke="#2a2d31" stroke-width="3.5"/>`;
  s += `<circle cx="${LX}" cy="${LY}" r="28" fill="none" stroke="#7e858d" stroke-width="3"/>`;
  s += `<circle cx="${LX}" cy="${LY}" r="25" fill="#fffdf6"/>`;
  s += `<rect width="1024" height="1536" fill="url(#jnGlare)" style="mix-blend-mode:screen"/>`;
  s += `<circle cx="${LX}" cy="${LY}" r="74" fill="#fff4dc" opacity="0.85" filter="url(#jnB14)"/>`;
  s += `<circle cx="${LX}" cy="${LY}" r="26" fill="#ffffff"/>`;
  // 빛줄기(가로로 길게 + 비스듬히 몇 가닥)
  s += P(ray(LX, LY, 0, 330, 4), '#ffe9c4', 'none', 0, 'opacity="0.4"');
  s += P(ray(LX, LY, 0, 170, 7), '#fff6e4', 'none', 0, 'opacity="0.55"');
  for (const [a, l] of [[0.62, 110], [-0.62, 100], [1.57, 80], [2.3, 90]]) s += P(ray(LX, LY, a, l, 3.2), '#fff2d8', 'none', 0, 'opacity="0.5"');
  // ---------------- 비네트 · 아래 가장자리
  s += `<rect width="1024" height="1536" fill="url(#jnVig)"/>`;
  s += `<rect y="1330" width="1024" height="206" fill="url(#jnBot)"/>`;
  return K.svg(s, { defs });
}
