import React from "react";
import {createAssistant, createSmartappDebugger,} from "@salutejs/client";

import {Container, Row} from '@salutejs/plasma-ui/components/Grid'
import {Col} from '@salutejs/plasma-ui/components/Grid'
import {Card, CardBody, CardContent} from '@salutejs/plasma-ui/components/Card'
import styled, { createGlobalStyle } from 'styled-components';
import { sberBox, sberPortal } from '@salutejs/plasma-tokens/typo';
import { body1} from '@salutejs/plasma-tokens';
import { darkJoy, darkEva, darkSber } from '@salutejs/plasma-tokens/themes';
import { text, background, gradient } from '@salutejs/plasma-tokens';
import { Cell } from "@salutejs/plasma-ui";
import { Stage, Layer, Circle, Image } from 'react-konva';
import useImage from 'use-image';
import { BodyXXS, TextXS } from "@salutejs/plasma-ui";
import { H3, H2} from "@salutejs/plasma-ui";
import { DeviceThemeProvider, detectDevice } from '@salutejs/plasma-ui';
import { CarouselGridWrapper, Carousel, CarouselCol } from '@salutejs/plasma-ui';
import { Spinner } from '@salutejs/plasma-ui';


const deviceKind = process.env.DEVICE;
const detectDeviceCallback = () => deviceKind;
const cities = ['Москва', 'Санкт-Петербург', "Самара", "Пермь"];


const AppStyled = styled.div`
  ${body1}
  color: ${text};
  background-color: ${background};
  background-image: ${gradient};
  min-height: 100vh;
`;

const Theme = createGlobalStyle(darkSber);
const TypoScale = createGlobalStyle(sberBox);

const initializeAssistant = (getState) => {
  if (process.env.NODE_ENV === "development") {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? "",
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
      getState,
    });
  }
  return createAssistant({getState});
};


const MyImage = (props) => {
  const { width, height, x } = props;
  const [image] = useImage('https://raw.githubusercontent.com/incllude/GMSberApp/main/public/smllr.png');
  return <Image image={image} width={width} height={height} x={x}/>;
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


function proccess_matches(matches) {

  let proccessed_matches = []
  for (let i = 0; i < matches.length; i++) {
    let team1_id = matches[i].team1.id;
    let team2_id = matches[i].team2.id;
    let showing_match = {
      team1: {
        shots:   matches[i].hits[team1_id],
        players: matches[i].lineup[team1_id],
        club:    proccess(matches[i].team1.name),
        scored:  matches[i].team1_score,
        pG:      matches[i].team1_predicted_score
      },
      team2: {
        shots:   matches[i].hits[team2_id],
        players: matches[i].lineup[team2_id],
        club:    proccess(matches[i].team2.name),
        scored:  matches[i].team2_score,
        pG:      matches[i].team2_predicted_score
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


export class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      matches: [],
      index: 0,
      loading: true,
      showing_matches: [],
      showing: {
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
      }
    }

    fetch('https://goalmindanalytics.onrender.com/api/matches/last/8/?format=json')
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
         });

    this.state.coef = 928 / 1676;
    this.state.width = window.innerWidth * 0.45;
    this.state.pos_x = 0;
    this.state.l = false;
    this.state.s = false;
    let border = 0.07;

    if (window.innerWidth < 1120) {
      this.state.pos_x = 1 / 4;
      this.state.l = true;
    } else if (window.innerWidth < 1540) {
      this.state.pos_x = 3 / 6;
      border = 0.085;
      this.state.width = window.innerWidth * 0.4;
      this.state.l = true;
    } else if (window.innerWidth < 1900) {
      this.state.pos_x = 5 / 8;
      this.state.s = true;
    } else {
      this.state.pos_x = 8 / 12;
    }
    this.state.height = this.state.width * this.state.coef;
    this.state.pos_x = (this.state.pos_x * window.innerWidth * (1 - 2 * border) - this.state.width) / 2;

    this.state.start_point = {
      x: this.state.width / 2,
      y: this.state.height / 2
    }

    this.assistant = initializeAssistant(() => this.getStateForAssistant());

    this.assistant.on("data", (event) => {
      console.log(`assistant.on(data)`, event);
      if (event.type === "character") {
        console.log(`assistant.on(data): character: "${event?.character?.id}"`);
      } else if (event.type === "insets") {
        console.log(`assistant.on(data): insets`);
      } else {
        const {action} = event;
        this.dispatchAssistantAction(action);
      }
    });

    this.assistant.on("start", (event) => {

      let initialData = this.assistant.getInitialData();

      console.log(`assistant.on(start)`, event, initialData);
    });

    this.assistant.on("command", (event) => {
      console.log(`assistant.on(command)`, event);
    });

    this.assistant.on("error", (event) => {
      console.log(`assistant.on(error)`, event);
    });

    this.assistant.on("tts", (event) => {
      console.log(`assistant.on(tts)`, event);
    });

    window.addEventListener('keydown', (event) => {
      switch(event.code) {
        case 'ArrowDown':
          break;
         case 'ArrowUp':
          break;
         case 'ArrowLeft':
          if (this.state.index > 0) {
            this.setState({index: this.state.index - 1});
          }
          break;
         case 'ArrowRight':
          if (this.state.index < 7) {
            this.setState({index: this.state.index + 1});
          }
          break;
         case 'Enter':
         break;
      }
    });
  }

  getStateForAssistant() {
    console.log('getStateForAssistant: this.state:', this.state)
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
    console.log('getStateForAssistant: state:', state)
    return state;
  }

  dispatchAssistantAction(action) {
    if (action) {
      switch (action.type) {
        case 'show_match':
          return this.show_match(action);

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
    if (this.state.index < 7) {
      this.setState({index: this.state.index + 1});
    }
  }

  show_match(action) {
    this.state.showing = this.state.showing_matches[action.index];
    this.setState({index: action.index});
  }

  close_match() {
  }

  render() {

    const showing_match = this.state.showing;

    return (
      <DeviceThemeProvider detectDeviceCallback={detectDeviceCallback} responsiveTypo={true}>
        <Theme />
        <TypoScale />

        <AppStyled>
        {
          this.state.loading ?
          <Spinner size={100} style={{margin: 'auto'}}/> :
          <Container>

            <Row>

              <CarouselGridWrapper>
                  <Carousel
                      axis="x"
                      index={this.state.index}
                      scrollSnapType="mandatory"
                      detectActive
                      style={{ paddingTop: '1rem', paddingBottom: '0.5rem' }}
                      onIndexChange={(i) => this.show_match({index: i})}
                  >
                    {
                      this.state.showing_matches.map((item, i) => (
                        <CarouselCol key={`item:${i}`} sizeS={2.5} sizeM={4.5} sizeL={5.5} sizeXL={8.5} scrollSnapAlign="start">
                          <Card scaleOnFocus={true} focused={i === this.state.index}>
                            <CardBody>
                              <CardContent>
                                <Cell contentLeft={item.team1.club} contentRight={<H3>{item.team1.scored}</H3>} />
                                <Cell contentLeft={item.team2.club} contentRight={<H3>{item.team2.scored}</H3>} />
                              </CardContent>
                            </CardBody>
                          </Card>
                        </CarouselCol>
                      ))
                    }
                  </Carousel>
              </CarouselGridWrapper>
            </Row>
            <Row>
            
                  <Col sizeS={1.875} sizeM={2.875} sizeL={3.875} sizeXL={5.875}>
                    <Cell contentLeft={<H3>{showing_match.team1.club}</H3>} contentRight={<H2>{showing_match.team1.pG}</H2>} />
                  </Col>
                  <Col sizeS={ 0.25} sizeM={ 0.25} sizeL={ 0.25} sizeXL={ 0.25} style={{alignItems: 'center'}}>
                    <Cell content={<H2>{':'}</H2>}/>
                  </Col>
                  <Col sizeS={1.875} sizeM={2.875} sizeL={3.875} sizeXL={5.875}>
                    <Cell contentLeft={<H2>{showing_match.team2.pG}</H2>} contentRight={<H3>{showing_match.team2.club}</H3>} />
                  </Col>
            
            </Row>
            <Row>

              <Col sizeS={1.5} sizeM={1.5} sizeL={1.5} sizeXL={2}>
                {
                  showing_match.team1.players.map((value) => (
                    this.state.l ?
                    <BodyXXS style={{textAlign: 'left'}}>{'(' + (value.playerNo < 10 ? '0' : '') + value.playerNo + ') ' + value.player_name}</BodyXXS> :
                    <TextXS style={{textAlign: 'left'}}>{'(' + (value.playerNo < 10 ? '0' : '') + value.playerNo + ') ' + value.player_name}</TextXS>
                  ))
                }
              </Col>
              <Col sizeS={1} sizeM={3} sizeL={5} sizeXL={8}>
                <Stage width={window.innerWidth * 0.7} height={this.state.height}>
                  <Layer>
                    <MyImage width={this.state.width} height={this.state.height} x={this.state.pos_x}/>
                    {
                      showing_match.team1.shots.map((value) => (
                        <Circle x={this.state.pos_x + reflect(this.state.start_point.x, transform(this.state.start_point, value).x)} y={reflect(this.state.start_point.y, transform(this.state.start_point, value).y)} radius={8 * (value.PG + 1)} fill="purple" stroke="white"/>
                      ))
                    }
                    {
                      showing_match.team2.shots.map((value) => (
                        <Circle x={this.state.pos_x + transform(this.state.start_point, value).x} y={transform(this.state.start_point, value).y} radius={8 * (value.PG + 1)} fill="orange" stroke="white"/>
                      ))
                    }
                  </Layer>
                </Stage>
              </Col>
              <Col sizeS={1.5} sizeM={1.5} sizeL={1.5} sizeXL={2}>
                {
                  showing_match.team2.players.map((value) => (
                    this.state.l ?
                    <BodyXXS style={{textAlign: 'right'}}>{value.player_name + ' (' + (value.playerNo < 10 ? '0' : '') + value.playerNo + ')'}</BodyXXS>:
                    <TextXS style={{textAlign: 'right'}}>{value.player_name + ' (' + (value.playerNo < 10 ? '0' : '') + value.playerNo + ')'}</TextXS>
                  ))
                }
              </Col>

            </Row>
          </Container>

        }
        </AppStyled>

      </DeviceThemeProvider>
    )
  }


}

