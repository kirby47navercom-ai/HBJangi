#include "JanggiGame.h"
using namespace janggi;
void JanggiGame::Start(){
  hb::UI::Show(this,"Assets/UI/W_Janggi.hbwidget.json","board");
  position=initial(blue,red);history={position};selected=-1;notice="기물을 선택해 주세요.\n이동할 곳을 누르면 한 수를 둬요.";confirmReset=false;Render();
}
void JanggiGame::Record(){
  history.push_back(position);
  int count=0;for(const auto& p:history)if(key(p)==key(position))count++;
  // shortcut: 반복 국면은 일괄 무승부, 대회 모드 도입 시 연속 장군·추격 규정을 구분한다.
  if(count>=3){position.draw=true;history.back()=position;notice="같은 국면이 세 번 반복되어 무승부예요.";}
  selected=-1;confirmReset=false;
}
void JanggiGame::Click(int cell){
  if(cell<0||cell>=90||position.winner||position.draw)return;
  confirmReset=false;
  if(selected==cell){selected=-1;notice="선택을 취소했어요.";}
  else if(side(position.board[cell])==position.turn){selected=cell;notice="금색 점으로 표시된 곳으로 이동할 수 있어요.";}
  else if(selected>=0&&legal(position,selected,cell)){
    int captured=position.board[cell];move(position,selected,cell);notice=captured?"상대 기물을 잡았어요.":"다음 차례예요.";Record();
  }else notice="그곳으로는 이동할 수 없어요.";
  Render();
}
void JanggiGame::Action(int command){
  if(command==0){if(history.size()>1){history.pop_back();position=history.back();selected=-1;notice="한 수를 무른 상태예요.";}else notice="아직 무를 수가 없어요.";confirmReset=false;}
  else if(command==1){if(!confirmReset&&history.size()>1){confirmReset=true;notice="새 대국을 다시 누르면 현재 대국을 지워요.";}else {hb::UI::Remove(this,"board");Start();return;}}
  else if(command==2){if(pass(position)){notice="한 수를 쉬었어요.";Record();}else notice="장군 상태에서는 한 수를 쉴 수 없어요.";}
  else if(command==3){if(!position.winner&&!position.draw&&facing(position)&&!check(position,position.turn)){position.draw=true;notice="빅장을 받아 무승부로 끝냈어요.";history.back()=position;}}
  else if(command==4||command==5){if(history.size()==1){if(command==4)blue=(blue+1)%4;else red=(red+1)%4;position=initial(blue,red);history={position};selected=-1;notice="마·상 배치를 바꿨어요.";}}
  Render();
}
void JanggiGame::Render(){
  const char* labels[]={"","궁","사","상","마","차","포","졸"};
  for(int i=0;i<90;i++){
    std::string n="Cell"+std::to_string(i),art="Art"+std::to_string(i);int p=position.board[i];
    hb::UI::SetTexture(this,"board",art,p?"Assets/Art/"+std::string(p>0?"Blue":"Red")+".svg":"Assets/Art/Empty.svg");
    bool dest=selected>=0&&legal(position,selected,i);
    hb::UI::SetText(this,"board",n,p?(std::abs(p)==King?(p>0?"楚":"漢"):(p<0&&std::abs(p)==Soldier?"병":labels[std::abs(p)])):dest?"•":"");
    hb::UI::SetColor(this,"board",n,dest?hb::Color{.70f,.43f,.10f,1}:p>0?hb::Color{.10f,.31f,.38f,1}:hb::Color{.61f,.19f,.17f,1});
  }
  int marked=selected>=0?selected:position.lastTo;
  hb::UI::SetVisible(this,"board","Selection",marked>=0);
  if(marked>=0)hb::UI::SetPosition(this,"board","Selection",hb::Vec2{float(104+marked%9*72-32),float(186+marked/9*72-32)});
  std::string status=position.draw?"무승부":position.winner?(position.winner>0?"초 승리":"한 승리"):(position.turn>0?"초의 차례":"한의 차례");
  if(!position.draw&&!position.winner&&check(position,position.turn))status+=" · 장군!";
  hb::UI::SetText(this,"board","Status",status);
  hb::UI::SetText(this,"board","Notice",notice);
  hb::UI::SetText(this,"board","MoveCount",std::to_string(history.size()-1)+" 수 진행");
  hb::UI::SetEnabled(this,"board","Undo",history.size()>1);
  hb::UI::SetText(this,"board","New",confirmReset?"새 대국 확인":"새 대국");
  hb::UI::SetEnabled(this,"board","Pass",!position.winner&&!position.draw&&!check(position,position.turn));
  hb::UI::SetEnabled(this,"board","Draw",!position.winner&&!position.draw&&facing(position)&&!check(position,position.turn));
  hb::UI::SetEnabled(this,"board","BlueSetup",history.size()==1);
  hb::UI::SetEnabled(this,"board","RedSetup",history.size()==1);
  const char* forms[]={"상마 / 마상","마상 / 마상","상마 / 상마","마상 / 상마"};
  hb::UI::SetText(this,"board","BlueSetup",std::string("초 배치  ")+forms[blue]);
  hb::UI::SetText(this,"board","RedSetup",std::string("한 배치  ")+forms[red]);
  int blueScore=0,redScore=0;const int values[]={0,0,3,3,5,13,7,2};
  for(int q:position.board){if(q>0)blueScore+=values[q];else if(q<0)redScore+=values[-q];}
  hb::UI::SetText(this,"board","BlueScore","초  ·  남은 기물 "+std::to_string(blueScore)+"점");
  hb::UI::SetText(this,"board","RedScore","한  ·  남은 기물 "+std::to_string(redScore)+"점");
}
