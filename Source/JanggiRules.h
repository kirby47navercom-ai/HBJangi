#pragma once
#include <array>
#include <vector>
#include <string>
#include <algorithm>
#include <cstdlib>

namespace janggi {
enum Kind { King=1, Guard, Elephant, Horse, Rook, Cannon, Soldier };
struct Position {
  std::array<int,90> board{};
  int turn=1, passes=0, winner=0, lastFrom=-1, lastTo=-1;
  bool draw=false;
};
inline int side(int p){return (p>0)-(p<0);}
inline bool inside(int x,int y){return x>=0&&x<9&&y>=0&&y<10;}
inline bool palace(int x,int y,int s){return x>=3&&x<=5&&(s==1?y>=7&&y<=9:y>=0&&y<=2);}
inline bool diagonal(int a,int b){
  int ax=a%9,ay=a/9,bx=b%9,by=b/9;
  for(int top:{0,7})if(palace(ax,ay,top?1:-1)&&palace(bx,by,top?1:-1)){
    if(ax-3==ay-top&&bx-3==by-top)return true;
    if(ax-3+ay-top==2&&bx-3+by-top==2)return true;
  }
  return false;
}
inline Position initial(int blue=0,int red=0){
  Position p;
  for(int s:{1,-1}){
    int row=s==1?9:0,form=s==1?blue:red;
    int back[9]={Rook,Elephant,Horse,Guard,0,Guard,Horse,Elephant,Rook};
    if(form&1)std::swap(back[1],back[2]);
    if(form&2)std::swap(back[6],back[7]);
    for(int x=0;x<9;x++)p.board[row*9+x]=s*back[x];
    p.board[(s==1?8:1)*9+4]=s*King;
    for(int x:{1,7})p.board[(s==1?7:2)*9+x]=s*Cannon;
    for(int x:{0,2,4,6,8})p.board[(s==1?6:3)*9+x]=s*Soldier;
  }
  return p;
}
inline bool attacks(const Position& p,int a,int b){
  if(a<0||a>=90||b<0||b>=90||a==b||!p.board[a])return false;
  int piece=p.board[a],s=side(piece),k=std::abs(piece),ax=a%9,ay=a/9,bx=b%9,by=b/9;
  int dx=bx-ax,dy=by-ay,X=std::abs(dx),Y=std::abs(dy),sx=side(dx),sy=side(dy);
  if(k==King||k==Guard)return palace(bx,by,s)&&palace(ax,ay,s)&&((X+Y==1)||(X==1&&Y==1&&diagonal(a,b)));
  if(k==Soldier)return (Y==0&&X==1)||(X==0&&dy==-s)||(X==1&&dy==-s&&diagonal(a,b));
  if(k==Horse){
    if(X==2&&Y==1)return !p.board[ay*9+ax+sx];
    if(X==1&&Y==2)return !p.board[(ay+sy)*9+ax];
    return false;
  }
  if(k==Elephant){
    if(X==3&&Y==2)return !p.board[ay*9+ax+sx]&&!p.board[(ay+sy)*9+ax+2*sx];
    if(X==2&&Y==3)return !p.board[(ay+sy)*9+ax]&&!p.board[(ay+2*sy)*9+ax+sx];
    return false;
  }
  if(k==Rook||k==Cannon){
    if(!(dx==0||dy==0||(X==Y&&diagonal(a,b))))return false;
    int screens=0;
    for(int x=ax+sx,y=ay+sy;x!=bx||y!=by;x+=sx,y+=sy){
      int q=p.board[y*9+x];
      if(q){if(k==Cannon&&std::abs(q)==Cannon)return false;screens++;}
    }
    return k==Rook?screens==0:screens==1&&std::abs(p.board[b])!=Cannon;
  }
  return false;
}
inline bool check(const Position& p,int s){
  auto it=std::find(p.board.begin(),p.board.end(),s*King);
  if(it==p.board.end())return true;
  int king=int(it-p.board.begin());
  for(int a=0;a<90;a++)if(side(p.board[a])==-s&&attacks(p,a,king))return true;
  return false;
}
inline bool facing(const Position& p){
  int a=-1,b=-1;
  for(int i=0;i<90;i++){if(p.board[i]==King)a=i;if(p.board[i]==-King)b=i;}
  if(a<0||b<0||a%9!=b%9)return false;
  if(a>b)std::swap(a,b);
  for(int i=a+9;i<b;i+=9)if(p.board[i])return false;
  return true;
}
inline bool legal(const Position& p,int a,int b){
  if(p.winner||p.draw||a<0||a>=90||b<0||b>=90||side(p.board[a])!=p.turn||side(p.board[b])==p.turn||std::abs(p.board[b])==King||!attacks(p,a,b))return false;
  Position q=p;q.board[b]=q.board[a];q.board[a]=0;
  return !check(q,p.turn);
}
inline bool hasMove(const Position& p){for(int a=0;a<90;a++)for(int b=0;b<90;b++)if(legal(p,a,b))return true;return false;}
inline bool move(Position& p,int a,int b){
  if(!legal(p,a,b))return false;
  p.board[b]=p.board[a];p.board[a]=0;p.turn=-p.turn;p.passes=0;p.lastFrom=a;p.lastTo=b;
  if(check(p,p.turn)&&!hasMove(p))p.winner=-p.turn;
  return true;
}
inline bool pass(Position& p){
  if(p.winner||p.draw||check(p,p.turn))return false;
  p.turn=-p.turn;p.passes++;p.lastFrom=p.lastTo=-1;if(p.passes==2)p.draw=true;return true;
}
inline std::string key(const Position& p){std::string k;for(int q:p.board)k+=char(q+8);k+=char(p.turn+1);return k;}
}
