#include "JanggiGame.h"
#include <cmath>
using namespace janggi;
namespace {
void present(hb::Actor* actor,bool visible,const hb::Vec3& position){
  if(!actor)return;
  bool active=hb::ActorPool::IsActive(actor);
  if(visible){if(!active){hb::Transform transform;transform.position=position;hb::ActorPool::Acquire({actor},transform);}else hb::Scene::SetPosition(actor,position);}
  else if(active)hb::ActorPool::Release(actor);
}
}
void JanggiGame::Start(){
  hb::UI::Show(this,"Assets/UI/W_Janggi.hbwidget.json","board");
  position=initial(blue,red);history={position};selected=-1;cursor=76;keyboard=false;notice="기물을 고른 뒤\n이동할 곳을 누르세요.";confirmReset=false;Render();
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
  else if(side(position.board[cell])==position.turn){selected=cell;notice="금색 고리가 있는 곳으로\n이동할 수 있어요.";}
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
void JanggiGame::Key(int command){
  if(command<0||command>4)return;
  keyboard=true;
  int x=cursor%9,z=cursor/9;
  if(command==0)x=std::max(0,x-1);
  if(command==1)x=std::min(8,x+1);
  if(command==2)z=std::max(0,z-1);
  if(command==3)z=std::min(9,z+1);
  cursor=z*9+x;
  if(command==4)Click(cursor);else Render();
}
void JanggiGame::Pointer(){
  hb::Vec3 hit;
  if(!hb::Input::GetMouseWorldPosition(hb::Vec3{0,1,0},hb::Vec3{0,.15f,0},hit))return;
  int x=int(std::round(hit.x+4)),z=int(std::round(hit.z+4.5f));
  if(inside(x,z)&&std::abs(hit.x-(x-4))<.49f&&std::abs(hit.z-(z-4.5f))<.49f){keyboard=false;cursor=z*9+x;Click(cursor);}
}
void JanggiGame::Render(){
  int counts[2][8]{};
  for(int i=0;i<90;i++){
    int p=position.board[i];
    if(p){int s=p>0?0:1,k=std::abs(p),index=counts[s][k]++;auto* actor=hb::Scene::FindActorById(std::string(p>0?"Blue":"Red")+std::to_string(k)+"_"+std::to_string(index),true);present(actor,true,hb::Vec3{float(i%9-4),0,float(i/9)-4.5f});if(actor)hb::Scene::SetRotation(actor,hb::Vec3{0,p>0?0.f:180.f,0});}
    auto* hint=hb::Scene::FindActorById("Hint"+std::to_string(i),true);
    present(hint,selected>=0&&legal(position,selected,i),hb::Vec3{float(i%9-4),.035f,float(i/9)-4.5f});
  }
  const int totals[]={0,1,2,2,2,2,2,5};
  for(int s=0;s<2;s++)for(int k=1;k<=7;k++)for(int j=counts[s][k];j<totals[k];j++){auto* actor=hb::Scene::FindActorById(std::string(s==0?"Blue":"Red")+std::to_string(k)+"_"+std::to_string(j),true);present(actor,false,hb::Vec3{});}
  int marked=keyboard?cursor:selected>=0?selected:position.lastTo;
  present(hb::Scene::FindActorById("Selection",true),marked>=0,hb::Vec3{float(marked%9-4),.055f,float(marked/9)-4.5f});
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
  const char* forms[]={"象馬 / 馬象","馬象 / 馬象","象馬 / 象馬","馬象 / 象馬"};
  hb::UI::SetText(this,"board","BlueSetup",std::string("초 배치  ")+forms[blue]);
  hb::UI::SetText(this,"board","RedSetup",std::string("한 배치  ")+forms[red==1?2:red==2?1:red]);
  int blueScore=0,redScore=0;const int values[]={0,0,3,3,5,13,7,2};
  for(int q:position.board){if(q>0)blueScore+=values[q];else if(q<0)redScore+=values[-q];}
  hb::UI::SetText(this,"board","BlueScore","楚  "+std::to_string(blueScore));
  hb::UI::SetText(this,"board","RedScore","漢  "+std::to_string(redScore));
}
