import React, {useRef} from "react";
import {createAssistant, createSmartappDebugger,} from "@salutejs/client";

import {Container, Row} from '@salutejs/plasma-ui/components/Grid'
import {Col} from '@salutejs/plasma-ui/components/Grid'
import {Card, CardBody, CardContent} from '@salutejs/plasma-ui/components/Card'
import styled, { createGlobalStyle } from 'styled-components';
import { sberBox, sberPortal } from '@salutejs/plasma-tokens/typo';
import { body1} from '@salutejs/plasma-tokens';
import { darkJoy, darkEva, darkSber } from '@salutejs/plasma-tokens/themes';
import { text, background, gradient } from '@salutejs/plasma-tokens';
import {CarouselItem, Cell} from "@salutejs/plasma-ui";
import { BodyL, TextS, TextM, TextXS } from "@salutejs/plasma-ui";
import { H5, H4, H3, H2, H1 } from "@salutejs/plasma-ui";
import { DeviceThemeProvider, detectDevice } from '@salutejs/plasma-ui';
import { Spinner, Badge, Image, Marquee } from '@salutejs/plasma-ui';


const deviceKind = process.env.DEVICE;
const detectDeviceCallback = () => deviceKind;
const cities = ['Москва', 'Санкт-Петербург', "Самара", "Пермь"];
const club_to_short = {
    'Зенит': 'ЗЕН',
    'Факел': 'ФКЛ',
    'Крылья Советов': 'КС',
    'Спартак': 'СПА',
    'Нижний Новгород': 'ПАРИ',
    'Химки': 'ХИМ',
    'Локомотив': 'ЛОКО',
    'Торпедо': 'ТОР',
    'ФК Ахмат': 'АХМ',
    'ФК Краснодар': 'КРА',
    'ЦСКА': 'ЦСКА',
    'ФК Ростов': 'РОС',
}


const AppStyled = styled.div`
  ${body1}
  color: ${text};
  background-color: ${background};
  background-image: ${gradient};
  min-height: 100vh;
  html:focus,
  html:focus-visible,
  body:focus,
  body:focus-visible,
  root:focus,
  root:focus-visible{
    outline: none !important;
  }
`;

const Theme = createGlobalStyle(darkEva);
const TypoScale = createGlobalStyle(sberBox);

const initializeAssistant = (getState) => {
  if (process.env.NODE_ENV === "development") {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? "",
      initPhrase: `Включи ${process.env.REACT_APP_SMARTAPP}`,
      getState,
    });
  }
  return createAssistant({getState});
};


function transform(start_point, point) {
  const transform_y = start_point.y / 50;
  const transform_x = start_point.x / 50;
  return {x: (100 - point.xPos) * 1.15 * transform_x, y: point.yPos * transform_y}
}


function reflect(center, point) {
  return 2 * center - point;
}


function filter(team) {

  let shooted = new Array(1000000).fill(false);
  let players_filtered = [];
  for (let i = 0; i < team.shots.length; i++) {
    shooted[team.shots[i].player] = true;
  }
  for (let i = 0; i < team.players.length; i++) {
      if (team.players[i].is_first_eleven === true) {
      players_filtered.push(team.players[i]);
    }
  }
  team.players = players_filtered;

  return team;
}


function unplug(team) {

  let players_edited = [];
  for (let i = 0; i < team.players.length; i++) {
    players_edited.push(team.players[i]);
    let splitted = players_edited[i].player_name.split(' ');
    if (splitted.length !== 1 && splitted[splitted.length - 1] !== '') {
      players_edited[i].player_name = splitted.slice(1).join(' ');
    }
  }
  team.players = players_edited;

  return team;
}


function proccess(club) {

  let splitted = club.split(' ');
  if (cities.includes(splitted[splitted.length - 1]) === true) {
    splitted = splitted.slice(0, splitted.length - 1);
  }
  return splitted.join(' ');
}

function add_zero(number) {
  if (number < 10) {
    return '0' + number;
  }
  return number;
}

function proccess_date(date_) {

  let from_num_to_day = {
    1: 'Понедельник',
    2: 'Вторник',
    3: 'Среда',
    4: 'Четверг',
    5: 'Пятница',
    6: 'Суббота',
    7: 'Воскресенье'
  }
  let date = new Date(date_);
  let day_number = date.getDate()
  let day = date.getDay();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  let day_of_week = from_num_to_day[day];

  return add_zero(day_number) + '.' + add_zero(month) + '.' + year;
}

function proccess_matches(matches) {

  let proccessed_matches = []
  for (let i = 0; i < matches.length; i++) {
    let team1_id = matches[i].team1.id;
    let team2_id = matches[i].team2.id;
    let showing_match = {
      league: 'Матч РПЛ',
      date: proccess_date(matches[i].datetime),
      team1: {
        shots:   matches[i].hits[team1_id],
        players: matches[i].lineup[team1_id],
        club:    proccess(matches[i].team1.name),
        scored:  matches[i].team1_score,
        pG:      matches[i].team1_predicted_score,
      },
      team2: {
        shots:   matches[i].hits[team2_id],
        players: matches[i].lineup[team2_id],
        club:    proccess(matches[i].team2.name),
        scored:  matches[i].team2_score,
        pG:      matches[i].team2_predicted_score,
      }
    }

    showing_match.team1 = filter(showing_match.team1);
    showing_match.team2 = filter(showing_match.team2);
    showing_match.team1 = unplug(showing_match.team1);
    showing_match.team2 = unplug(showing_match.team2);

    proccessed_matches.push(showing_match);
  }

  return proccessed_matches;
}


function get_match_sign(matches) {

    let signs = [];
    for (let i = 0; i < matches.length; i++) {
        signs.push({
            team1: matches[i].team1.club,
            team2: matches[i].team2.club
        });
    }

    return signs;
}


export class App extends React.Component {

  constructor(props) {
    super(props);

    this.empty_match = {
        league: '',
        date: '',
        team1: {
            shots: [],
            players: [],
            club: null,
            scored: null,
            pG: null
        },
        team2: {
            shots: [],
            players: [],
            club: null,
            scored: null,
            pG: null
        }
    };

    this.state = {
      matches: [],
      index: 0,
      prev: 0,
      loading: true,
      showing_matches: [],
      showing: this.empty_match
    }

    if (this.state.matches !== []) {
      fetch('https://gma-jodode.amvera.io/api/matches/last/8')
         .then(response => {
            if (response.ok) {
              return response.json();
            }
            throw response;
         })
         .then((data) => {
            this.state.matches = data;
         })
         .catch((err) => {
            console.log("ERROR: ", err);
         })
         .finally(() => {
            this.setState({loading: false});
            this.state.matches = this.state.matches.slice(0, 6);

            this.edited_matches = this.state.matches.map(
              (value, index) => ({
                team1_club:  proccess(value.team1.name),
                team2_club:  proccess(value.team2.name),
                team1_score: value.team1_score,
                team2_score: value.team2_score,
                id: index
              })
            )
        
            this.state.showing_matches = proccess_matches(this.state.matches);
            this.state.showing_matches.unshift(this.empty_match);
            this.state.match_signs = get_match_sign(this.state.showing_matches.slice(1));
         });
    }

    this.state.coef = 928 / 1676;
    this.state.width = window.innerWidth * 0.4;
    this.state.height = this.state.width * this.state.coef;
    this.state.pos_x = 0;
    this.state.dots = 0.5;
    let borderXL = 0.078, borderL = 0.072, borderM = 0.103, borderS = 0.12;
    this.state.sizeS  = 4 * this.state.width  / window.innerWidth / (1 - 2 * borderS);
    this.state.sizeM  = 6 * this.state.width  / window.innerWidth / (1 - 2 * borderM);
    this.state.sizeL  = 8 * this.state.width  / window.innerWidth / (1 - 2 * borderL);
    this.state.sizeXL = 12 * this.state.width / window.innerWidth / (1 - 2 * borderXL);

    this.state.start_point = {
      x: this.state.width / 2,
      y: this.state.height / 2
    }

    this.assistant = initializeAssistant(() => this.getStateForAssistant());

    this.assistant.on("data", (event) => {
      // console.log(`assistant.on(data)`, event);
      if (event.type === "character") {
        // console.log(`assistant.on(data): character: "${event?.character?.id}"`);
      } else if (event.type === "insets") {
        // console.log(`assistant.on(data): insets`);
      } else {
        const {action} = event;
        this.dispatchAssistantAction(action);
      }
    });

    this.assistant.on("start", (event) => {

      let initialData = this.assistant.getInitialData();

      // console.log(`assistant.on(start)`, event, initialData);
    });

    this.assistant.on("command", (event) => {
      // console.log(`assistant.on(command)`, event);
    });

    this.assistant.on("error", (event) => {
      console.log(`assistant.on(error)`, event);
    });

    this.assistant.on("tts", (event) => {
      // console.log(`assistant.on(tts)`, event);
    });

    window.addEventListener('keydown', (event) => {
      switch(event.code) {
        case 'ArrowDown':
          break;
         case 'ArrowUp':
          break;
         case 'ArrowLeft':
          if (this.state.index > 0) {
            // this.setState({index: this.state.index - 1});
            // this.assistant.sendData({action: {action_id: 'EVENT_LEFT_NOT_BEGIN', parameters: {index: this.state.index}}});
          } else {
            // this.assistant.sendData({action: {action_id: 'EVENT_LEFT_BEGIN'}});
          }
          break;
         case 'ArrowRight':
          if (this.state.index < this.state.matches.length - 1) {
            // this.setState({index: this.state.index + 1});
            // this.assistant.sendData({action: {action_id: 'EVENT_RIGHT_NOT_END', parameters: {index: this.state.index}}});
          } else {
            // this.assistant.sendData({action: {action_id: 'EVENT_RIGHT_END'}});
          }
          break;
         case 'Enter':
         break;
      }
    });
  }

  getStateForAssistant() {
    // console.log('getStateForAssistant: this.state:', this.state);
    const state = {
      item_selector: {
        items: this.state.matches.map(
          (value, index) => ({
            number: index,
            title: value.team1.name + ' ' + value.team2.name
          })
        ),
      },
    };
    // console.log('getStateForAssistant: state:', state);
    return state;
  }

  dispatchAssistantAction(action) {
    if (action) {
      switch (action.type) {
        case 'show_match':
          if (action.index !== null) {
            this.setState({index: action.index});
          }
          break;

        case 'close_match':
          return this.close_match();

        case 'next_match':
          return this.next_match();

        case 'prev_match':
          return this.prev_match();

        default:
          throw new Error();
      }
    }
  }

  prev_match(){
    if (this.state.index > 0) {
      this.setState({index: this.state.index - 1});
    }
  }

  next_match() {
    if (this.state.index < this.state.matches.length - 1) {
      this.setState({index: this.state.index + 1});
    }
  }

  show_match(action) {
      console.log('Active: ', document.activeElement.tagName, document.activeElement.type || 'N/A');
      if (action.index !== null && action.index !== this.state.index) {
          this.setState({index: action.index});
      }
  }

  close_match() {
  }

  render() {

    const showing_matches = this.state.showing_matches;
    const showing_match = showing_matches[this.state.index];
    const match_signs = this.state.match_signs;

    return (
      <DeviceThemeProvider detectDeviceCallback={detectDeviceCallback} responsiveTypo={true}>
        <Theme />
        <TypoScale />

        <AppStyled>
        {
          this.state.loading ?
          <Spinner size={100} style={{margin: 'auto'}} /> :

          <>
              <Container>
                  <Row
                      style={{
                          paddingTop: '1rem'
                      }}
                  >

                    {
                      showing_matches.map((item, i) => (
                          <Col
                            sizeS={4 / showing_matches.length}
                            sizeM={6 / showing_matches.length}
                            sizeL={8 / showing_matches.length}
                            sizeXL={12 / showing_matches.length}
                            style={{
                                display: 'flex', justifyContent: 'center',
                            }}
                          >
                              <Card
                                  tabIndex={i}
                                  onFocus={() => this.show_match({index: i})}
                                  focused={ i === this.state.index }
                                  style={{
                                      outline: 'none',
                                      height: window.innerHeight * 0.15,
                                      width: window.innerWidth * (1 - 0.03 * showing_matches.length) / showing_matches.length
                                  }}
                              >
                                <CardBody>
                                  <CardContent>
                                    {
                                      i === 0 ?
                                            <>
                                                <H5>Справка</H5>
                                            </>:
                                            <>
                                                <H3>{club_to_short[item.team1.club]}</H3>
                                                <H3>{club_to_short[item.team2.club]}</H3>
                                            </>
                                    }
                                  </CardContent>
                                </CardBody>
                              </Card>
                          </Col>
                      ))
                    }
                  </Row>
              </Container>
          <Container>

            {
              this.state.index === 0 ?

                  <Row>
                      <Col
                          sizeS={2}
                          sizeM={3}
                          sizeL={4}
                          sizeXL={6}
                      >
                          <Row style={{paddingTop: '1rem', paddingBottom: '0.5rem'}}>
                              <Col
                                  size={100}
                              >
                                    <Cell contentLeft={<H2>Последние матчи:</H2>}/>
                              </Col>
                          </Row>
                              {
                                  match_signs.map((item) => (
                                      <Row>
                                          <Col
                                              sizeS={2 - this.state.dots / 2}
                                              sizeM={3 - this.state.dots / 2}
                                              sizeL={4 - this.state.dots / 2}
                                              sizeXL={6 - this.state.dots / 2}
                                          >
                                              <TextS style={{textAlign: 'right'}}>({club_to_short[item.team1]}) {item.team1}</TextS>
                                          </Col>
                                          <Col
                                              sizeS={this.state.dots}
                                              sizeM={this.state.dots}
                                              sizeL={this.state.dots}
                                              sizeXL={this.state.dots}
                                          >
                                              <TextS style={{textAlign: 'center'}}>-</TextS>
                                          </Col>
                                          <Col
                                              sizeS={2 - this.state.dots / 2}
                                              sizeM={3 - this.state.dots / 2}
                                              sizeL={4 - this.state.dots / 2}
                                              sizeXL={6 - this.state.dots / 2}
                                          >
                                              <TextS style={{textAlign: 'left'}}>{item.team2} ({club_to_short[item.team2]})</TextS>
                                          </Col>
                                      </Row>
                                  ))
                              }
                      </Col>

                      <Col
                          sizeS={0.67}
                          sizeM={1}
                          sizeL={1.33}
                          sizeXL={2}
                      >
                      </Col>
                      <Col
                          sizeS={1.33}
                          sizeM={2}
                          sizeL={2.67}
                          sizeXL={4}
                      >
                          <Row style={{paddingTop: '1rem', paddingBottom: '0.5rem'}}>
                              <Col
                                  size={100}
                              >
                                  <Cell contentLeft={<H2>Справка:</H2>}/>
                              </Col>
                          </Row>
                          <Row>
                              <Col
                                  size={100}
                              >
                                  <Cell contentLeft={
                                      <div>
                                          <Badge size='s' style={{backgroundColor: 'purple'}}/>
                                          <Badge size='s' style={{backgroundColor: 'orange'}}/>
                                      </div>
                                  }
                                        contentRight={<TextS>обозначает точку удара команды; чем больше размер, тем опаснее момент</TextS>}
                                        style={{paddingBottom: '0.5rem'}}
                                  />
                                  <Cell style={{paddingBottom: '0.5rem'}} contentLeft={<H4>Число pG</H4>} contentRight={<TextS>показывает ожидаемое количество голов команда, основанное на статистике</TextS>} />
                                  <Cell contentLeft={<TextS>Информация о матчах обновляется 2 раза в неделю</TextS>} />
                                  <Cell contentLeft={<TextS>Сокращения клубов взяты из официальных материалов чемпионата</TextS>} />
                              </Col>
                          </Row>
                      </Col>
                  </Row>

                  :

                  <Row>
                    <Col
                        sizeS={2 - this.state.sizeS / 2}
                        sizeM={3 - this.state.sizeM / 2}
                        sizeL={4 - this.state.sizeL / 2}
                        sizeXL={6 - this.state.sizeXL / 2}
                      >
                        <Row style={{paddingBottom: '0.65rem'}}>
                            <Col
                                size={100}
                                style={{display: 'flex', justifyContent: 'center'}}
                            >
                                <Cell
                                    contentLeft={<H4>{showing_match.league}</H4>}
                                />
                            </Col>
                        </Row>

                        <Row style={{paddingBottom: '0.5rem', paddingTop: '0.5rem'}}>
                          <Col
                              size={100}
                              style={{display: 'flex', justifyContent: 'center'}}
                          >
                            <Badge text={<H3>{showing_match.team1.club}</H3>} size='l' style={{backgroundColor: 'purple'}}/>
                          </Col>
                        </Row>
                        <Row style={{paddingBottom: '0.5rem', paddingTop: '0.5rem'}}>
                            <Col
                                size={100}
                                style={{display: 'flex', justifyContent: 'center'}}
                            >
                                <Cell style={{width: '75%'}} contentLeft={<H5>Забито</H5>} contentRight={<H3>{showing_match.team1.scored}</H3>} />
                            </Col>
                        </Row>
                        <Row style={{paddingBottom: '1rem'}}>
                          <Col
                              size={100}
                              style={{display: 'flex', justifyContent: 'center'}}
                          >
                            <Cell style={{width: '75%'}} contentLeft={<Badge size='s' style={{backgroundColor: 'purple'}}/>} contentRight={<H5>удар {showing_match.team1.club}</H5>} />
                          </Col>
                        </Row>
                        <Row>
                          <Col
                              size={100}
                          >
                            <H5 style={{textAlign: 'center'}}>Состав:</H5>
                          </Col>
                        </Row>
                        <Row>
                          <Col
                              sizeS={2}
                              sizeM={3}
                              sizeL={4}
                              sizeXL={6}
                          >
                            {
                              showing_match.team1.players.slice(0, 6).map((value) => (
                                  <TextXS style={{textAlign: 'left'}}>  {'• ' + value.player_name} </TextXS>
                              ))
                            }
                          </Col>
                          <Col
                              sizeS={2}
                              sizeM={3}
                              sizeL={4}
                              sizeXL={6}
                          >
                            {
                              showing_match.team1.players.slice(6).map((value) => (
                                  <TextXS style={{textAlign: 'left'}}>  {'• ' + value.player_name} </TextXS>
                              ))
                            }
                          </Col>
                        </Row>
                      </Col>

                      <Col
                          sizeS={this.state.sizeS}
                          sizeM={this.state.sizeM}
                          sizeL={this.state.sizeL}
                          sizeXL={this.state.sizeXL}
                      >
                          <Row style={{paddingBottom: '0.25rem'}}>
                              <Col
                                  size={100}
                                  style={{display: 'flex', justifyContent: 'center'}}
                              >
                                  <Cell
                                      contentLeft={<H4>Ожидаемые голы (pG)</H4>}
                                  />
                              </Col>
                          </Row>
                        <Row>
                          <Col
                              sizeS =  {2 - this.state.dots / 2}
                              sizeM =  {3 - this.state.dots / 2}
                              sizeL =  {4 - this.state.dots / 2}
                              sizeXL = {6 - this.state.dots / 2}
                          >
                              <H2 style={{textAlign: 'right'}}>{showing_match.team1.pG}</H2>
                          </Col>
                          <Col
                              sizeS =  {this.state.dots}
                              sizeM =  {this.state.dots}
                              sizeL =  {this.state.dots}
                              sizeXL = {this.state.dots}
                          >
                            <H2 style={{textAlign: 'center'}}>:</H2>
                          </Col>
                          <Col
                              sizeS =  {2 - this.state.dots / 2}
                              sizeM =  {3 - this.state.dots / 2}
                              sizeL =  {4 - this.state.dots / 2}
                              sizeXL = {6 - this.state.dots / 2}
                          >
                              <H2 style={{textAlign: 'left'}}>{showing_match.team2.pG}</H2>
                          </Col>
                        </Row>
                        <Row>
                          <Col
                              size={100}
                          >
                              <Image
                                  src={`https://raw.githubusercontent.com/incllude/GMSberApp/main/src/img/match_${this.state.index}.png`}
                                  width={this.state.width}
                                  height={this.state.height}
                                  style={{margin: 'auto'}}
                              />
                          </Col>
                        </Row>
                      </Col>

                      <Col
                          sizeS={2 - this.state.sizeS / 2}
                          sizeM={3 - this.state.sizeM / 2}
                          sizeL={4 - this.state.sizeL / 2}
                          sizeXL={6 - this.state.sizeXL / 2}
                      >
                          <Row style={{paddingBottom: '0.65rem'}}>
                              <Col
                                  size={100}
                                  style={{display: 'flex', justifyContent: 'center'}}
                              >
                                  <Cell
                                      contentLeft={<H4>{showing_match.date}</H4>}
                                  />
                              </Col>
                          </Row>

                        <Row style={{paddingBottom: '0.5rem', paddingTop: '0.5rem'}}>
                          <Col
                              size={100}
                              style={{display: 'flex', justifyContent: 'center'}}
                          >
                            <Badge text={<H3 style={{color: 'black'}}>{showing_match.team2.club}</H3>} size='l' style={{backgroundColor: 'orange'}}/>
                          </Col>
                        </Row>
                          <Row style={{paddingBottom: '0.5rem', paddingTop: '0.5rem'}}>
                              <Col
                                  size={100}
                                  style={{display: 'flex', justifyContent: 'center'}}
                              >
                                  <Cell style={{width: '75%'}} contentLeft={<H5>Забито</H5>} contentRight={<H3>{showing_match.team2.scored}</H3>} />
                              </Col>
                          </Row>
                        <Row style={{paddingBottom: '1rem'}}>
                          <Col
                              size={100}
                              style={{display: 'flex', justifyContent: 'center'}}
                          >
                            <Cell style={{width: '75%'}} contentLeft={<Badge size='s' style={{backgroundColor: 'orange'}}/>} contentRight={<H5>удар {showing_match.team2.club}</H5>} />
                          </Col>
                        </Row>
                        <Row>
                          <Col
                              size={100}
                          >
                            <H5 style={{textAlign: 'center'}}>Состав:</H5>
                          </Col>
                        </Row>
                        <Row>
                          <Col
                              sizeS={2}
                              sizeM={3}
                              sizeL={4}
                              sizeXL={6}
                          >
                            {
                              showing_match.team2.players.slice(0, 6).map((value) => (
                                  <TextXS style={{textAlign: 'left'}}>  {'• ' + value.player_name} </TextXS>
                              ))
                            }
                          </Col>
                          <Col
                              sizeS={2}
                              sizeM={3}
                              sizeL={4}
                              sizeXL={6}
                          >
                            {
                              showing_match.team2.players.slice(6).map((value) => (
                                  <TextXS style={{textAlign: 'left'}}>  {'• ' + value.player_name} </TextXS>
                              ))
                            }
                          </Col>
                        </Row>
                      </Col>
                  </Row>
            }

          </Container>
          </>

        }
        </AppStyled>

      </DeviceThemeProvider>
    )
  }

}
