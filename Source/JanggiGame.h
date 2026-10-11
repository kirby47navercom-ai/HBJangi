#pragma once
#include <HBEngine/Game.hpp>
#include "JanggiRules.h"

HB_CLASS(Blueprintable)
class JanggiGame : public hb::Actor {
public:
  HB_FUNCTION(BlueprintCallable, KoreanName="장기 시작")
  void Start();
  HB_FUNCTION(BlueprintCallable, KoreanName="교차점 선택")
  void Click(int cell);
  HB_FUNCTION(BlueprintCallable, KoreanName="대국 조작")
  void Action(int command);
private:
  janggi::Position position;
  std::vector<janggi::Position> history;
  int selected=-1,blue=0,red=0;
  bool confirmReset=false;
  std::string notice;
  void Render();
  void Record();
};
