import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { MOCK_PLACES } from '../../../core/data/mock-places';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    component.places = MOCK_PLACES;
    fixture.detectChanges();
  });

  it('should create the map component', () => {
    expect(component).toBeTruthy();
  });

  it('should have default center coordinates and zoom for Sri Lanka', () => {
    expect(component.center).toEqual([7.8731, 80.7718]);
    expect(component.zoom).toBe(7);
  });

  it('should emit placeSelect when a place is selected', () => {
    let selected = false;
    component.placeSelect.subscribe((p) => {
      selected = true;
      expect(p.id).toBe(MOCK_PLACES[0].id);
    });

    component.placeSelect.emit(MOCK_PLACES[0]);
    expect(selected).toBe(true);
  });
});

