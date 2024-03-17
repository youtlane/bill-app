/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import userEvent from '@testing-library/user-event'
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      // Si l'icon dans vertical layout est highlighted alors il aura la classe active-icon
      expect(windowIcon.classList.contains('active-icon')).toBe(true);
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText
                    (/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
                    .map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  
    test("Then modal should be displayed with correct content when eye icon is clicked", async () => {
      const billUrl = "http://127.0.0.1:5500/src/assets/images/facturefreemobile.jpg"
      const billsService = new Bills({
        document, store: null, localStorage: window.localStorage
      })
      // Préparation du DOM avec une icône "œil"
      document.body.innerHTML = BillsUI({ data: bills })
      const iconEye = screen.getAllByTestId('icon-eye')[0]
    
      const handleShowModal = jest.fn((e) => billsService.handleClickIconEye(iconEye))

      // Simulation d'un clic sur l'icône "œil"
      iconEye.addEventListener('click', handleShowModal)
      userEvent.click(iconEye)
      expect(handleShowModal).toHaveBeenCalled()

    
      // Attente de l'affichage de la boîte modale
      await waitFor(() => {
        const modalFile = screen.queryByTestId('modale-file');
        expect(modalFile).toBeDefined()
      });
    
      // Récupération de la modal-body
      const modalBody = screen.getByTestId('modale-file').querySelector('.modal-body')
      const modalImage = modalBody.querySelector('img')

      // Vérification du contenu de la boîte modale
      expect(modalImage).toBeTruthy()
      expect(modalImage.getAttribute('src')).toEqual(billUrl)
    })
    test("Then newBills page should be displayed when button newBills is clicked", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const billsService = new Bills({
        document, onNavigate, localStorage: window.localStorage
      })

      document.body.innerHTML = BillsUI({ data: bills })
      const buttonNewBill = screen.getAllByTestId('btn-new-bill')[0]
    
      const handleBtnClickNewBill = jest.fn((e) => billsService.handleClickNewBill())

      // Simulation d'un clic sur le boutton nouvelle note de frais
      buttonNewBill.addEventListener('click', handleBtnClickNewBill)
      userEvent.click(buttonNewBill)
      expect(handleBtnClickNewBill).toHaveBeenCalled()

      await waitFor(() => {
        const formNewBill = screen.queryByTestId('form-new-bill');
        expect(formNewBill).toBeDefined()
      });
    })

    test("Then getBills is called ans should be return 4 bills", async () => {
      const billsService = new Bills({
        document, store: mockStore, localStorage: window.localStorage
      })

      const billsResult = await billsService.getBills();

      // Vérifiez si le résultat est un tableau avec 4 éléments
      expect(Array.isArray(billsResult)).toBe(true);
      expect(billsResult.length).toBe(4);
    })
  })
})
