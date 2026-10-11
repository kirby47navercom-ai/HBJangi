#include "../Source/JanggiRules.h"
#include <cassert>
#include <iostream>
using namespace janggi;
int main(){
  auto p=initial();assert(std::count_if(p.board.begin(),p.board.end(),[](int q){return q!=0;})==32);assert(!check(p,1)&&!check(p,-1));
  assert(legal(p,54,45));assert(!legal(p,54,63));assert(!legal(p,64,46));
  assert(move(p,54,45)&&p.turn==-1);assert(pass(p)&&p.turn==1);assert(pass(p)&&p.draw);assert(!move(p,56,47));
  Position q;q.board[76]=King;q.board[13]=-King;q.board[40]=Soldier;
  q.board[40]=0;q.board[49]=Horse;assert(attacks(q,49,32));q.board[40]=Soldier;assert(!attacks(q,49,32));
  q.board={};q.board[49]=Elephant;assert(attacks(q,49,20));q.board[40]=Soldier;assert(!attacks(q,49,20));
  q.board[40]=0;q.board[30]=Soldier;assert(!attacks(q,49,20));
  q.board={};q.board[76]=King;q.board[13]=-King;q.board[40]=Soldier;q.board[64]=Cannon;
  assert(!attacks(q,64,28));q.board[46]=Soldier;assert(attacks(q,64,28));q.board[46]=Cannon;assert(!attacks(q,64,28));q.board[46]=Soldier;q.board[28]=-Cannon;assert(!attacks(q,64,28));
  q.board={};q.board[66]=Rook;assert(attacks(q,66,86));q.board[76]=Soldier;assert(!attacks(q,66,86));q.board[66]=Cannon;assert(attacks(q,66,86));q.board[76]=Cannon;assert(!attacks(q,66,86));
  q.board={};q.board[76]=King;q.board[13]=-King;assert(facing(q));assert(!check(q,1));q.board[40]=Soldier;assert(!facing(q));
  q.board[22]=-Rook;assert(check(q,1)==false);q.board[40]=0;assert(check(q,1));assert(!pass(q));
  q=initial();q.board[67]=Soldier;assert(legal(q,76,66));assert(!legal(q,76,65));
  assert(initial(1).board[82]==Horse&&initial(2).board[87]==Elephant);
  q.board={};q.board[76]=King;q.board[13]=-King;q.board[67]=Rook;q.board[22]=-Rook;
  assert(!legal(q,67,66));assert(legal(q,67,58));assert(!legal(q,-1,90));assert(!legal(q,13,22));
  q.board={};q.board[66]=Soldier;assert(attacks(q,66,58)==false);q.board[3]=Soldier;assert(attacks(q,3,13)==false);
  q.board[21]=Soldier;assert(attacks(q,21,13));q.board[13]=Soldier;assert(attacks(q,13,3)&&attacks(q,13,5));
  q.board={};q.board[76]=King;q.board[13]=-King;q.board[66]=-Rook;q.board[67]=-Rook;q.board[68]=-Rook;
  assert(check(q,1)&&!hasMove(q));
  // Every accepted move preserves the moving king; deterministic game smoke.
  p=initial();for(int turn=0;turn<120&&!p.winner&&!p.draw;turn++){
    bool moved=false;for(int a=0;a<90&&!moved;a++)for(int b=0;b<90&&!moved;b++)if(legal(p,a,b)){int s=p.turn;assert(move(p,a,b));assert(!check(p,s));moved=true;}
    if(!moved)assert(pass(p));
  }
  std::cout<<"PASS: setup, movement, blockers, cannon, palace, check, mate, pass, bikjang, bounds, 120-ply safety\n";
}
